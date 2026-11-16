import { afterEach, expect, it, vi } from 'vitest'

vi.mock('server/ENV', () => ({
  ENV: {
    ELICE: { API_KEY: 'test-key', INTENT_ENDPOINT: 'https://elice.test', IS_CONFIGURED: true },
  },
}))

import { interpretSearchQuery as interpret } from './search-intent'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function response(answer: string, finishReason = 'stop') {
  return new Response(
    JSON.stringify({
      choices: [{ finish_reason: finishReason, message: { content: answer } }],
    }),
  )
}

it.each([
  ['춤', '댄스'],
  ['코딩', '프로그래밍'],
])('preprocesses %s even without spaces', async (query, topic) => {
  const fetch = vi.fn().mockResolvedValueOnce(response(topic))
  vi.stubGlobal('fetch', fetch)

  await expect(interpret(`  ${query}  `)).resolves.toBe(topic)
  expect(fetch).toHaveBeenCalledTimes(1)
  expect(JSON.parse(fetch.mock.calls[0][1].body).messages[1].content).toBe(query)
})

it.each([
  ['개발하기 좋은 곳', '개발 동아리', '개발'],
  ['동아리방 있는 중앙 밴드', '중앙 동아리 밴드', '중앙 밴드'],
  ['좋은 동아리 추천해줘', '동아리', '동아리'],
])('removes the generic word from the topic of %s', async (query, answer, topic) => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(response(answer)))

  await expect(interpret(query)).resolves.toBe(topic)
})

it('searches the original query when the answer is cut off, and retries instead of caching the fallback', async () => {
  const query = '회비 없이 개발 배우고 싶어'
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(response('소프트웨어 개발을 배울 수 있는', 'length'))
    .mockResolvedValueOnce(response('소프트웨어 개발'))
  vi.stubGlobal('fetch', fetch)
  vi.spyOn(console, 'error').mockImplementation(() => {})

  await expect(interpret(query)).resolves.toBe(query)
  await expect(interpret(query)).resolves.toBe('소프트웨어 개발')
  expect(fetch).toHaveBeenCalledTimes(2)
})
