import { getEncoding } from 'js-tiktoken'
import { chunk } from 'lodash-es'
import { ENV } from 'server/ENV'
import { z } from 'zod'

// Elice ML API를 부릅니다. 모델마다 주소가 따로 있습니다.
//
//   임베딩: 글 → 벡터
//   채팅: 지시문 + 입력 → JSON

// ── 임베딩 ──────────────────────────────────────────────

// ELICE_EMBEDDING_ENDPOINT는 이 모델의 주소여야 합니다.
export const EMBEDDING_MODEL = 'text-embedding-3-large'
// large의 기본 차원. Prisma 스키마의 vector(3072)와 일치해야 합니다.
export const EMBEDDING_DIMENSIONS = 3072
export const EMBEDDING_VERSION = `${EMBEDDING_MODEL}:${EMBEDDING_DIMENSIONS}:v2`

// 모델이 한 번에 받는 입력의 한도입니다. 더 긴 글은 이 길이의 조각으로 나눕니다.
const MAX_TOKENS_PER_PIECE = 8191
// 32조각은 최대 262,112토큰입니다. 요청당 300,000토큰 한도 안에서 처리합니다.
const PIECES_PER_REQUEST = 32

const tokenizer = getEncoding('cl100k_base')

// 글 하나에서 잘라낸 조각. 어느 글의 조각인지 기억합니다.
type Piece = {
  textIndex: number
  tokens: number[]
}

// 글마다 임베딩 벡터를 하나씩 만듭니다.
// 긴 글은 조각마다 벡터를 구한 뒤, 조각 길이를 가중치로 평균냅니다.
export async function createEmbeddings(texts: string[], timeoutMs: number) {
  if (!ENV.ELICE.IS_CONFIGURED) {
    throw new Error('Elice 환경 변수가 설정되지 않았습니다.')
  }
  if (texts.length === 0 || texts.some((text) => !text.trim())) {
    throw new Error('임베딩 입력이 비어 있습니다.')
  }

  const pieces = splitIntoPieces(texts)
  const sums = texts.map(() => zeroVector())
  let totalTokens = 0

  for (const batch of chunk(pieces, PIECES_PER_REQUEST)) {
    const inputs = batch.map((piece) => piece.tokens)
    const result = await requestEmbeddings(inputs, timeoutMs)

    totalTokens += result.tokens

    for (const [index, piece] of batch.entries()) {
      const sum = sums[piece.textIndex]
      const vector = result.vectors[index]
      const weight = piece.tokens.length

      addWeighted(sum, vector, weight)
    }
  }

  // 가중 합을 단위 벡터로 만들면 가중 평균과 방향이 같습니다.
  const vectors = sums.map(normalizeVector)

  return { vectors, tokens: totalTokens }
}

function splitIntoPieces(texts: string[]): Piece[] {
  const pieces: Piece[] = []

  for (const [textIndex, text] of texts.entries()) {
    const tokens = tokenizer.encode(text, [], [])

    for (const pieceTokens of chunk(tokens, MAX_TOKENS_PER_PIECE)) {
      pieces.push({ textIndex, tokens: pieceTokens })
    }
  }
  return pieces
}

function zeroVector(): number[] {
  return Array(EMBEDDING_DIMENSIONS).fill(0)
}

// sum += vector × weight
function addWeighted(sum: number[], vector: number[], weight: number): void {
  for (let dimension = 0; dimension < sum.length; dimension++) {
    sum[dimension] += vector[dimension] * weight
  }
}

function normalizeVector(vector: number[]): number[] {
  const norm = Math.hypot(...vector)
  if (!Number.isFinite(norm) || norm === 0) {
    throw new Error('임베딩을 합칠 수 없습니다.')
  }
  return vector.map((value) => value / norm)
}

const embeddingResponseSchema = z.object({
  data: z.array(
    z.object({
      index: z.number().int().nonnegative(),
      embedding: z.array(z.number().finite()).length(EMBEDDING_DIMENSIONS),
    }),
  ),
  usage: z.object({ total_tokens: z.number().int().nonnegative() }),
})

// 토큰 배열을 그대로 보내 벡터를 받습니다. 입력 하나에 벡터 하나가 입력 순서대로 돌아옵니다.
async function requestEmbeddings(inputs: number[][], timeoutMs: number) {
  const url = `${ENV.ELICE.EMBEDDING_ENDPOINT}/v1/embeddings`
  const body = {
    model: EMBEDDING_MODEL,
    dimensions: EMBEDDING_DIMENSIONS,
    encoding_format: 'float',
    input: inputs,
  }

  const response = await post(url, body, timeoutMs)
  if (!response.ok) {
    throw new Error(`임베딩 API 요청 실패 (${response.status})`)
  }

  const result = embeddingResponseSchema.parse(await response.json())
  const rows = result.data.sort((a, b) => a.index - b.index)

  const hasEveryInput = rows.length === inputs.length && rows.every((row, i) => row.index === i)
  const hasEmptyVector = rows.some((row) => row.embedding.every((value) => value === 0))
  if (!hasEveryInput || hasEmptyVector) {
    throw new Error('임베딩 API 응답 형식이 올바르지 않습니다.')
  }

  return {
    vectors: rows.map((row) => row.embedding),
    tokens: result.usage.total_tokens,
  }
}

// ── 채팅 ────────────────────────────────────────────────

// ELICE_INTENT_ENDPOINT는 이 모델의 주소여야 합니다.
const CHAT_MODEL = 'gemini-2.5-flash-lite'

// 지시문과 입력을 보내고, 모델이 답한 JSON을 돌려줍니다. 형식은 부른 쪽이 검사합니다.
export async function requestChatJson(
  instructions: string,
  input: string,
  timeoutMs: number,
): Promise<unknown> {
  const url = `${ENV.ELICE.INTENT_ENDPOINT}/v1/chat/completions`
  // Elice는 목록에 없는 파라미터를 400으로 거절합니다. 추론은 reasoning_effort로 끕니다.
  const body = {
    model: CHAT_MODEL,
    reasoning_effort: 'none',
    temperature: 0,
    max_completion_tokens: 512,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: instructions },
      { role: 'user', content: input },
    ],
  }

  const response = await post(url, body, timeoutMs)
  if (!response.ok) {
    throw new Error(`채팅 API 요청 실패 (${response.status})`)
  }

  const result = await response.json()
  const choice = result.choices?.[0]
  if (choice?.finish_reason !== 'stop') {
    throw new Error('채팅 API 응답이 완료되지 않았습니다.')
  }

  return JSON.parse(choice.message.content)
}

// ── 공통 ────────────────────────────────────────────────

function post(url: string, body: unknown, timeoutMs: number): Promise<Response> {
  return fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ENV.ELICE.API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  })
}
