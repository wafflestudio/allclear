import { getEncoding } from 'js-tiktoken'
import { afterEach, expect, it, vi } from 'vitest'

vi.mock('server/ENV', () => ({ ENV: { OPENAI: { API_KEY: 'test-key' } } }))

import { createEmbeddings, EMBEDDING_DIMENSIONS } from './embedding'

const tokenizer = getEncoding('cl100k_base')
const vector = (axis: number) =>
  Array.from({ length: EMBEDDING_DIMENSIONS }, (_, i) => Number(i === axis))

afterEach(() => {
  vi.unstubAllGlobals()
})

it('keeps long documents intact across request batches', async () => {
  const input = [...Array(31).fill('동아리'), '모집 '.repeat(5000), '음악']
  const requests: number[][][] = []
  let chunkIndex = 0
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url, options) => {
      const { input: batch } = JSON.parse(options.body) as { input: number[][] }
      requests.push(batch)
      const data = batch.map((_, index) => ({ index, embedding: vector(chunkIndex++) }))
      return new Response(
        JSON.stringify({
          data: data.reverse(),
          usage: { total_tokens: batch.reduce((sum, tokens) => sum + tokens.length, 0) },
        }),
      )
    }),
  )

  const result = await createEmbeddings(input)
  const chunks = requests.flat()
  expect(requests.map((batch) => batch.length)).toEqual([32, 2])
  expect(chunks.flat()).toEqual(input.flatMap((text) => tokenizer.encode(text, [], [])))
  expect(chunks.every((tokens) => tokens.length <= 8191)).toBe(true)
  expect(result.tokens).toBe(chunks.flat().length)
  expect(result.vectors).toHaveLength(input.length)
  expect(result.vectors[0]).toEqual(vector(0))
  expect(result.vectors[32]).toEqual(vector(33))

  const lengths = [chunks[31].length, chunks[32].length]
  const norm = Math.hypot(...lengths)
  expect(result.vectors[31][31]).toBeCloseTo(lengths[0] / norm)
  expect(result.vectors[31][32]).toBeCloseTo(lengths[1] / norm)
  expect(Math.hypot(...result.vectors[31])).toBeCloseTo(1)
})
