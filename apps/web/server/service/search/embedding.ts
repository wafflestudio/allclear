import { createHash } from 'node:crypto'
import { LRUCache } from 'lru-cache'
import { ENV } from 'server/ENV'
import { z } from 'zod'

export const EMBEDDING_MODEL = 'text-embedding-3-small'
export const EMBEDDING_DIMENSIONS = 1536
export const EMBEDDING_VERSION = `${EMBEDDING_MODEL}:1536:v1`

export type EmbeddingSource = {
  name: string
  short_description: string | null
  description: string | null
  introduction: string | null
}

const fields = (club: EmbeddingSource) => [
  club.name,
  club.short_description,
  club.description,
  club.introduction,
]

export const sourceHash = (club: EmbeddingSource) =>
  createHash('sha256')
    .update(JSON.stringify(fields(club)))
    .digest('hex')

export function embeddingText(club: EmbeddingSource): string {
  const text = fields(club)
    .filter(Boolean)
    .join('\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // UTF-8 바이트 수로 제한해 한국어도 모델의 8192 토큰 한도를 넘지 않게 합니다.
  return Buffer.from(text).subarray(0, 7000).toString('utf8').trim()
}

const responseSchema = z.object({
  data: z.array(
    z.object({
      index: z.number().int().nonnegative(),
      embedding: z.array(z.number().finite()).length(EMBEDDING_DIMENSIONS),
    }),
  ),
  usage: z.object({ total_tokens: z.number().int().nonnegative() }),
})

export async function createEmbeddings(input: string[], timeoutMs = 30_000) {
  if (!ENV.OPENAI.API_KEY) throw new Error('OPEN_AI_KEY가 설정되지 않았습니다.')
  if (input.length === 0 || input.some((text) => !text.trim())) {
    throw new Error('임베딩 입력이 비어 있습니다.')
  }

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
