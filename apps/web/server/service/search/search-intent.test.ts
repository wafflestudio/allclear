import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const { ENV } = vi.hoisted(() => ({
  ENV: { DEEPSEEK: { API_KEY: 'deepseek-key' }, PERPLEXITY: { API_KEY: 'perplexity-key' } },
}))
vi.mock('server/ENV', () => ({ ENV }))

let interpret: typeof import('./search-intent').interpretSearchQuery

beforeEach(async () => {
  vi.resetModules()
  ENV.DEEPSEEK.API_KEY = 'deepseek-key'
  ENV.PERPLEXITY.API_KEY = 'perplexity-key'
  interpret = (await import('./search-intent')).interpretSearchQuery
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function decisions(choices: Record<string, string> = {}) {
  const fields = [
    'affiliationType',
    'isRecruiting',
    'recruitType',
    'hasMembershipFee',
    'hasDongbang',
    'isOfficialVerified',
    'minActivityPeriods',
  ]
  return {
    answers: Object.fromEntries(
      fields.map((field) => [
        field,
        { type: 'choice', choice: choices[field] ?? 'none', confidence: 0.99 },
      ]),
    ),
  }
}

function rewritten(searchQuery: string) {
  return {
    choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({ searchQuery }) } }],
  }
}

function mockResponses(...bodies: unknown[]) {
  const fetch = vi.fn()
  for (const body of bodies) fetch.mockResolvedValueOnce(Response.json(body))
  vi.stubGlobal('fetch', fetch)
  return fetch
}

it('passes Decider filters to DeepSeek, which only produces the search query', async () => {
  const query = '회비 없고 동방 있는 중앙동아리에서 코딩 배우고 싶어'
  const filters = { affiliationType: '중앙동아리', hasMembershipFee: false, hasDongbang: true }
  const fetch = mockResponses(
    decisions({ affiliationType: '중앙동아리', hasMembershipFee: 'false', hasDongbang: 'true' }),
    rewritten('프로그래밍 초보자 교육'),
  )

  await expect(interpret(query)).resolves.toEqual({
    searchQuery: '프로그래밍 초보자 교육',
    filters,
  })

  const [deciderUrl, deciderOptions] = fetch.mock.calls[0]
  const [deepseekUrl, deepseekOptions] = fetch.mock.calls[1]
  expect(deciderUrl).toBe('https://api.perplexity.ai/v1/decisions')
  expect(deepseekUrl).toBe('https://api.deepseek.com/chat/completions')
  expect(JSON.parse(deciderOptions.body)).toMatchObject({
    state: query,
    model: 'pplx-decider-v1.2',
  })
  const request = JSON.parse(deepseekOptions.body)
  expect(JSON.parse(request.messages[1].content)).toEqual({ query, filters })
  expect(request.messages[0].content).toMatch(/json/i)
  expect(deepseekOptions.signal).toBe(deciderOptions.signal)
})

it('does not turn unmentioned or uncertain conditions into false filters', async () => {
  const result = decisions({ hasDongbang: 'true' })
  result.answers.hasDongbang.confidence = 0.6
  mockResponses(result, rewritten('INTP 성향'))

  await expect(interpret('INTP한테 어울리는 동아리')).resolves.toEqual({
    searchQuery: 'INTP 성향',
    filters: {},
  })
})

it('keeps false and all selected activity-period buckets', async () => {
  mockResponses(decisions({ isRecruiting: 'false', minActivityPeriods: '0,1' }), rewritten('개발'))
  await expect(interpret('모집 끝났고 한 학기만 활동 가능한 개발 동아리')).resolves.toEqual({
    searchQuery: '개발',
    filters: { isRecruiting: false, minActivityPeriods: ['0', '1'] },
  })
})

it.each(['invalid-choice', 'missing-answer', 'invalid-confidence'])(
  'rejects %s and leaves the original conditions for the rewriter',
  async (problem) => {
    const query = '회비 없이 개발 배우고 싶어'
    const invalid = decisions({ hasMembershipFee: 'false' })
    if (problem === 'invalid-choice') invalid.answers.hasMembershipFee.choice = 'free'
    if (problem === 'missing-answer') delete invalid.answers.hasMembershipFee
    if (problem === 'invalid-confidence') invalid.answers.hasMembershipFee.confidence = 2
    const fetch = mockResponses(
      invalid,
      rewritten('회비 없는 소프트웨어 개발'),
      decisions({ hasMembershipFee: 'false' }),
      rewritten('소프트웨어 개발'),
    )

    await expect(interpret(query)).resolves.toEqual({
      searchQuery: '회비 없는 소프트웨어 개발',
      filters: {},
    })
    const rewriteInput = JSON.parse(JSON.parse(fetch.mock.calls[1][1].body).messages[1].content)
    expect(rewriteInput).toEqual({ query, filters: {} })

    await expect(interpret(query)).resolves.toEqual({
      searchQuery: '소프트웨어 개발',
      filters: { hasMembershipFee: false },
    })
    expect(fetch).toHaveBeenCalledTimes(4)
  },
)

it('keeps accepted filters when DeepSeek fails, and retries on the next search', async () => {
  const query = '동방 있는 음악 동아리'
  const fetch = mockResponses(
    decisions({ hasDongbang: 'true' }),
    { choices: [{ finish_reason: 'length', message: { content: '{}' } }] },
    decisions({ hasDongbang: 'true' }),
    rewritten('음악'),
  )

  await expect(interpret(query)).resolves.toEqual({
    searchQuery: query,
    filters: { hasDongbang: true },
  })
  await expect(interpret(query)).resolves.toEqual({
    searchQuery: '음악',
    filters: { hasDongbang: true },
  })
  expect(fetch).toHaveBeenCalledTimes(4)
})

it('rejects filters returned by DeepSeek', async () => {
  const query = '동방 있는 음악 동아리'
  mockResponses(decisions({ hasDongbang: 'true' }), {
    choices: [
      {
        finish_reason: 'stop',
        message: { content: '{"searchQuery":"음악","filters":{"hasMembershipFee":false}}' },
      },
    ],
  })
  await expect(interpret(query)).resolves.toEqual({
    searchQuery: query,
    filters: { hasDongbang: true },
  })
})

it('shares normalized, simultaneous and repeated searches', async () => {
  const fetch = mockResponses(decisions(), rewritten('소프트웨어 개발'))
  const expected = { searchQuery: '소프트웨어 개발', filters: {} }
  await expect(
    Promise.all([interpret('  개발   동아리  '), interpret('개발 동아리')]),
  ).resolves.toEqual([expected, expected])
  await expect(interpret('개발 동아리')).resolves.toEqual(expected)
  expect(fetch).toHaveBeenCalledTimes(2)
})

it('skips both APIs for a single word', async () => {
  const fetch = mockResponses()
  await expect(interpret('  코딩  ')).resolves.toEqual({ searchQuery: '코딩', filters: {} })
  expect(fetch).not.toHaveBeenCalled()
})

it('rewrites with no applied filters when Perplexity is not configured', async () => {
  ENV.PERPLEXITY.API_KEY = ''
  const query = '회비 없는 개발 동아리'
  const fetch = mockResponses(rewritten('회비 없는 소프트웨어 개발'))
  await expect(interpret(query)).resolves.toEqual({
    searchQuery: '회비 없는 소프트웨어 개발',
    filters: {},
  })
  expect(fetch).toHaveBeenCalledTimes(1)
  expect(JSON.parse(JSON.parse(fetch.mock.calls[0][1].body).messages[1].content)).toEqual({
    query,
    filters: {},
  })
})

it('uses the original query with Decider filters when DeepSeek is not configured', async () => {
  ENV.DEEPSEEK.API_KEY = ''
  const query = '회비 없는 개발 동아리'
  const fetch = mockResponses(decisions({ hasMembershipFee: 'false' }))
  await expect(interpret(query)).resolves.toEqual({
    searchQuery: query,
    filters: { hasMembershipFee: false },
  })
  expect(fetch).toHaveBeenCalledTimes(1)
})

it('does not start DeepSeek after the shared deadline has expired', async () => {
  const controller = new AbortController()
  const timeout = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(controller.signal)
  const fetch = vi.fn().mockImplementation(async () => {
    controller.abort()
    throw new DOMException('Timed out', 'TimeoutError')
  })
  vi.stubGlobal('fetch', fetch)

  const query = '동방 있는 음악 동아리'
  await expect(interpret(query)).resolves.toEqual({ searchQuery: query, filters: {} })
  expect(timeout).toHaveBeenCalledWith(3_000)
  expect(fetch).toHaveBeenCalledTimes(1)
})

it('retries when the deadline expires after Decider has already returned filters', async () => {
  const controller = new AbortController()
  vi.spyOn(AbortSignal, 'timeout')
    .mockReturnValueOnce(controller.signal)
    .mockReturnValue(new AbortController().signal)
  const fetch = vi
    .fn()
    .mockImplementationOnce(async () => {
      controller.abort()
      return Response.json(decisions({ hasDongbang: 'true' }))
    })
    .mockResolvedValueOnce(Response.json(decisions({ hasDongbang: 'true' })))
    .mockResolvedValueOnce(Response.json(rewritten('음악')))
  vi.stubGlobal('fetch', fetch)

  const query = '동방 있는 음악 동아리'
  await expect(interpret(query)).resolves.toEqual({
    searchQuery: query,
    filters: { hasDongbang: true },
  })
  await expect(interpret(query)).resolves.toEqual({
    searchQuery: '음악',
    filters: { hasDongbang: true },
  })
  expect(fetch).toHaveBeenCalledTimes(3)
})
