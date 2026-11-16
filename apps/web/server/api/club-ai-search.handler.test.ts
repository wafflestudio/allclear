import type { NextApiRequest, NextApiResponse } from 'next'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  search: vi.fn(),
  consume: vi.fn(),
  auth: vi.fn(),
}))
vi.mock('server/provider', () => ({
  Provider: { getService: () => ({ searchWithAi: mocks.search, consume: mocks.consume }) },
}))
vi.mock('server/service/search.service', () => ({ SearchService: class SearchService {} }))
vi.mock('server/service/ai-search-quota.service', () => ({
  AiSearchQuotaService: class AiSearchQuotaService {},
}))
vi.mock('server/util/optional-auth', () => ({ resolveOptionalAuth: mocks.auth }))
vi.mock('server/service/recent-search.service', () => ({ saveRecentSearchBestEffort: vi.fn() }))

import { TooManyRequestsError } from 'server/domain/error'
import handler from '../../pages/api/v2/clubs/ai-search'

async function request(query: NextApiRequest['query']) {
  const response = { status: vi.fn(), json: vi.fn(), send: vi.fn(), setHeader: vi.fn() }
  response.status.mockReturnValue(response)
  await handler({ method: 'GET', query } as NextApiRequest, response as unknown as NextApiResponse)
  return response
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.auth.mockResolvedValue({ type: 'member', accountId: 'test-account' })
  mocks.search.mockResolvedValue({ clubs: [], correctedQuery: null, isTypoCorrected: false })
})

describe('AI search daily limit', () => {
  it('counts one use for the member, then searches', async () => {
    const response = await request({ query: '개발 동아리' })

    expect(mocks.consume).toHaveBeenCalledWith('test-account')
    expect(mocks.search).toHaveBeenCalled()
    expect(response.status).toHaveBeenCalledWith(200)
  })

  it('rejects guests without counting or searching', async () => {
    mocks.auth.mockResolvedValue({ type: 'guest', guestId: 'test-guest' })

    const response = await request({ query: '개발 동아리' })

    expect(response.status).toHaveBeenCalledWith(401)
    expect(mocks.consume).not.toHaveBeenCalled()
    expect(mocks.search).not.toHaveBeenCalled()
  })

  it('rejects a member over the limit with Retry-After, without searching', async () => {
    const limitExceeded = new TooManyRequestsError('daily ai search limit exceeded', 60)
    mocks.consume.mockRejectedValueOnce(limitExceeded)

    const response = await request({ query: '개발 동아리' })

    expect(response.setHeader).toHaveBeenCalledWith('Retry-After', 60)
    expect(response.status).toHaveBeenCalledWith(429)
    expect(mocks.search).not.toHaveBeenCalled()
  })

  it('does not count an invalid request', async () => {
    const response = await request({ query: '개발 동아리', has_dongbang: 'maybe' })

    expect(response.status).toHaveBeenCalledWith(400)
    expect(mocks.consume).not.toHaveBeenCalled()
  })
})

describe('AI search minimum similarity', () => {
  it.each([
    [undefined, undefined],
    ['0', 0],
    ['0.35', 0.35],
    ['1', 1],
  ])('passes min_similarity %j to the search as %s', async (given, passed) => {
    await request({ query: '개발 동아리', min_similarity: given })

    expect(mocks.search).toHaveBeenCalledWith(
      '개발 동아리',
      expect.objectContaining({ minSimilarity: passed }),
    )
  })

  it.each(['-0.1', '1.5', 'abc', '', ['0.1', '0.2']])(
    'rejects min_similarity %j without counting',
    async (given) => {
      const response = await request({ query: '개발 동아리', min_similarity: given })

      expect(response.status).toHaveBeenCalledWith(400)
      expect(mocks.consume).not.toHaveBeenCalled()
    },
  )
})
