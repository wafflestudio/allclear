import type { NextApiRequest, NextApiResponse } from 'next'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  search: vi.fn(),
  auth: vi.fn(),
  save: vi.fn(),
}))
vi.mock('server/provider', () => ({
  Provider: { getService: () => ({ searchWithTypoCorrection: mocks.search }) },
}))
vi.mock('server/service/search.service', () => ({ SearchService: class SearchService {} }))
vi.mock('server/util/optional-auth', () => ({ resolveOptionalAuth: mocks.auth }))
vi.mock('server/service/recent-search.service', () => ({ saveRecentSearchBestEffort: mocks.save }))

import handler from '../../pages/api/v2/clubs/search'

async function request(query: NextApiRequest['query']) {
  const response = { status: vi.fn(), json: vi.fn(), send: vi.fn() }
  response.status.mockReturnValue(response)
  await handler({ method: 'GET', query } as NextApiRequest, response as unknown as NextApiResponse)
  return response
}

describe('club search recent-history contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.auth.mockResolvedValue({ type: 'member', accountId: 'test-account' })
    mocks.search.mockResolvedValue({
      clubs: [{ uuid: 'club-id', name: '와플스튜디오' }],
      correctedQuery: null,
      isTypoCorrected: false,
    })
  })

  it.each([undefined, 'true'])(
    'preserves normal search history with record flag %s',
    async (flag) => {
      const response = await request({ query: '와플', record_recent_search: flag })
      expect(response.status).toHaveBeenCalledWith(200)
      expect(mocks.save).toHaveBeenCalledWith({ type: 'member', accountId: 'test-account' }, '와플')
    },
  )

  it('returns the same search results without recording manager-registration lookup history', async () => {
    const response = await request({ query: '와플', record_recent_search: 'false' })
    expect(response.status).toHaveBeenCalledWith(200)
    expect(response.json).toHaveBeenCalledWith({
      clubs: [{ uuid: 'club-id', name: '와플스튜디오' }],
      totalSize: 1,
      query: '와플',
      correctedQuery: null,
      isTypoCorrected: false,
    })
    expect(mocks.save).not.toHaveBeenCalled()
  })

  it.each(['no', '', ['false', 'true']])(
    'rejects invalid record flags %j before search or writes',
    async (flag) => {
      const response = await request({ query: '와플', record_recent_search: flag })
      expect(response.status).toHaveBeenCalledWith(400)
      expect(mocks.search).not.toHaveBeenCalled()
      expect(mocks.save).not.toHaveBeenCalled()
    },
  )

  it.each(['true', 'false'])('respects guest history preference %s', async (flag) => {
    mocks.auth.mockResolvedValue({ type: 'guest', guestId: 'test-guest' })
    const response = await request({ query: '와플', record_recent_search: flag })
    expect(response.status).toHaveBeenCalledWith(200)
    if (flag === 'true') {
      expect(mocks.save).toHaveBeenCalledWith({ type: 'guest', guestId: 'test-guest' }, '와플')
    } else {
      expect(mocks.save).not.toHaveBeenCalled()
    }
  })
})
