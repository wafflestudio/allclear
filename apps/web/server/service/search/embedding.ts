import { getEncoding } from 'js-tiktoken'
import { LRUCache } from 'lru-cache'
import { ENV } from 'server/ENV'
import { z } from 'zod'

export const EMBEDDING_MODEL = 'text-embedding-3-small'
export const EMBEDDING_DIMENSIONS = 1536
export const EMBEDDING_VERSION = `${EMBEDDING_MODEL}:1536:v2`
// 같은 모델의 기존 벡터도 수동 갱신이 완료될 때까지 검색에 사용합니다.
export const SEARCH_EMBEDDING_VERSIONS = [EMBEDDING_VERSION, `${EMBEDDING_MODEL}:1536:v1`]

const tokenizer = getEncoding('cl100k_base')
const CHUNK_TOKENS = 8191
// 최대 262,112토큰: 요청당 300,000토큰 한도 안에서 처리합니다.
const CHUNKS_PER_REQUEST = 32

const responseSchema = z.object({
  data: z.array(
    z.object({
      index: z.number().int().nonnegative(),
      embedding: z.array(z.number().finite()).length(EMBEDDING_DIMENSIONS),
    }),
  ),
  usage: z.object({ total_tokens: z.number().int().nonnegative() }),
})

async function requestEmbeddings(input: number[][], timeoutMs: number) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ENV.OPENAI.API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      dimensions: EMBEDDING_DIMENSIONS,
      encoding_format: 'float',
      input,
    }),
    signal: AbortSignal.timeout(timeoutMs),
  })
  if (!response.ok) throw new Error(`임베딩 API 요청 실패 (${response.status})`)

  const result = responseSchema.parse(await response.json())
  const rows = result.data.sort((a, b) => a.index - b.index)
  if (
    rows.length !== input.length ||
    rows.some((row, index) => row.index !== index || row.embedding.every((value) => value === 0))
  ) {
    throw new Error('임베딩 API 응답 형식이 올바르지 않습니다.')
  }
  return { vectors: rows.map((row) => row.embedding), tokens: result.usage.total_tokens }
}

export async function createEmbeddings(input: string[], timeoutMs = 30_000) {
  if (!ENV.OPENAI.API_KEY) throw new Error('OPEN_AI_KEY가 설정되지 않았습니다.')
  if (input.length === 0 || input.some((text) => !text.trim())) {
    throw new Error('임베딩 입력이 비어 있습니다.')
  }

  const chunks = input.flatMap((text, owner) => {
    const tokens = tokenizer.encode(text, [], [])
    const parts: { owner: number; tokens: number[] }[] = []
    for (let offset = 0; offset < tokens.length; offset += CHUNK_TOKENS) {
      parts.push({ owner, tokens: tokens.slice(offset, offset + CHUNK_TOKENS) })
    }
    return parts
  })
  const vectors: number[][] = input.map(() => Array(EMBEDDING_DIMENSIONS).fill(0))
  let tokens = 0

  for (let offset = 0; offset < chunks.length; offset += CHUNKS_PER_REQUEST) {
    const batch = chunks.slice(offset, offset + CHUNKS_PER_REQUEST)
    const result = await requestEmbeddings(
      batch.map((chunk) => chunk.tokens),
      timeoutMs,
    )
    tokens += result.tokens
    for (const [index, chunk] of batch.entries()) {
      const vector = vectors[chunk.owner]
      for (let dimension = 0; dimension < vector.length; dimension++) {
        vector[dimension] += result.vectors[index][dimension] * chunk.tokens.length
      }
    }
  }

  // 조각 길이로 가중 평균한 뒤 정규화해 기존 vector(1536) 컬럼에 저장합니다.
  for (const vector of vectors) {
    const norm = Math.hypot(...vector)
    if (!Number.isFinite(norm) || norm === 0) throw new Error('임베딩을 합칠 수 없습니다.')
    for (let index = 0; index < vector.length; index++) vector[index] /= norm
  }
  return { vectors, tokens }
}

const queryCache = new LRUCache<string, Promise<number[]>>({ max: 500, ttl: 86_400_000 })

export async function embedQuery(query: string): Promise<number[]> {
  const text = query.trim().replace(/\s+/g, ' ')
  const cached = queryCache.get(text)
  if (cached) return cached

  const pending = createEmbeddings([text], 8_000)
    .then(({ vectors }) => vectors[0])
    .catch((error) => {
      queryCache.delete(text)
      throw error
    })
  queryCache.set(text, pending)
  return pending
}
