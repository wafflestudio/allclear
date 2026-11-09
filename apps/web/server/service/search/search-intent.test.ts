import { afterEach, expect, it, vi } from 'vitest'

vi.mock('server/ENV', () => ({ ENV: { DEEPSEEK: { API_KEY: 'test-key' } } }))

import { interpretSearchQuery as interpret } from './search-intent'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function response(intent: unknown) {
  return new Response(
    JSON.stringify({
      choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(intent) } }],
    }),
  )
}

it('rejects invalid filter types and retries instead of caching the fallback', async () => {
  const query = '회비 없이 개발 배우고 싶어'
  const intent = { searchQuery: '소프트웨어 개발', filters: { hasMembershipFee: false } }
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(response({ ...intent, filters: { hasMembershipFee: 'false' } }))
    .mockResolvedValueOnce(response(intent))
  vi.stubGlobal('fetch', fetch)
  vi.spyOn(console, 'error').mockImplementation(() => {})

  await expect(interpret(query)).resolves.toEqual({
    searchQuery: query,
    filters: {},
  })
  await expect(interpret(query)).resolves.toEqual(intent)
  expect(fetch).toHaveBeenCalledTimes(2)
})
