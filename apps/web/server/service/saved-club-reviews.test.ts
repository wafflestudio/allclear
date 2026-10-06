import { describe, expect, it, vi } from 'vitest'

vi.mock('../provider', () => ({
  Inject: () => () => undefined,
  InjectRepository: () => () => undefined,
  Service: () => undefined,
}))

import type { ClubEntity } from '../infra/database/entities'
import { ClubService } from './club.service'

describe('ClubService.findMySavedClubs review summaries', () => {
  it('returns existing review counts and ranked keywords for saved clubs', async () => {
    const service = Object.create(ClubService.prototype) as ClubService
    const reviewedClub = { uuid: 'reviewed', name: '와플스튜디오', imageUri: '' } as ClubEntity
    const emptyClub = { uuid: 'empty', name: '후기 없는 동아리', imageUri: '' } as ClubEntity
    Object.defineProperties(service, {
      userSavedClubRepository: {
        value: { findBy: vi.fn().mockResolvedValue([{ clubId: 'reviewed' }, { clubId: 'empty' }]) },
      },
      clubRepository: {
        value: { findBy: vi.fn().mockResolvedValue([reviewedClub, emptyClub]) },
      },
      userClubReviewRepository: {
        value: {
          find: vi.fn().mockResolvedValue([
            { clubId: 'reviewed', reviewKeywordIds: ['friendly', 'learning'] },
            { clubId: 'reviewed', reviewKeywordIds: ['learning'] },
          ]),
        },
      },
      clubReviewKeywordRepository: {
        value: {
          find: vi.fn().mockResolvedValue([
            { id: 'friendly', title: '친목', iconUri: '😊' },
            { id: 'learning', title: '배움', iconUri: '📚' },
          ]),
        },
      },
    })

    const result = await service.findMySavedClubs('test-user')

    expect(result.map((club) => club.uuid)).toEqual(['reviewed', 'empty'])
    expect(result[0]).toMatchObject({
      totalReviews: 2,
      reviewKeywords: [
        { id: 'learning', title: '배움', totalUpvotes: 2 },
        { id: 'friendly', title: '친목', totalUpvotes: 1 },
      ],
    })
    expect(result[1]).toMatchObject({ totalReviews: 0, reviewKeywords: [] })
  })

  it('returns no clubs without querying review repositories when the saved list is empty', async () => {
    const service = Object.create(ClubService.prototype) as ClubService
    Object.defineProperties(service, {
      userSavedClubRepository: { value: { findBy: vi.fn().mockResolvedValue([]) } },
      clubRepository: { value: { findBy: vi.fn().mockResolvedValue([]) } },
    })
    expect(await service.findMySavedClubs('test-user')).toEqual([])
  })
})
