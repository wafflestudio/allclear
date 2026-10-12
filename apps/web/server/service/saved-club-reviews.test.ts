import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prisma } = vi.hoisted(() => ({
  prisma: {
    user_saved_club: { findMany: vi.fn() },
    club: { findMany: vi.fn() },
    college_major: { findMany: vi.fn() },
    user_club_review: { findMany: vi.fn() },
    club_review_keyword: { findMany: vi.fn() },
  },
}))

vi.mock('../provider', () => ({
  Inject: () => () => undefined,
  Service: () => undefined,
}))
vi.mock('../infra/database/prisma', () => ({ getPrismaClient: () => prisma }))

import { ClubService } from './club.service'

const clubRow = (uuid: string, name: string) => ({
  uuid,
  name,
  description: '',
  short_description: '',
  introduction: null,
  type: '교내',
  category: '학술',
  affiliation_type: '중앙',
  college_major_id: null,
  recruit_type: '상시',
  is_official_verified: false,
  verified_at: null,
  has_dongbang: false,
  dongbang_location: null,
  min_activity_period: 0,
  active_member_count: 0,
  founded_at: null,
  sns_urls: [],
  activity_image_urls: [],
  image_uri: '',
  article: null,
  article_uploaded_at: null,
  status: 'APPROVED',
  reject_reason: null,
})

beforeEach(() => {
  vi.resetAllMocks()
  prisma.user_saved_club.findMany.mockResolvedValue([])
  prisma.club.findMany.mockResolvedValue([])
  prisma.college_major.findMany.mockResolvedValue([])
  prisma.user_club_review.findMany.mockResolvedValue([])
  prisma.club_review_keyword.findMany.mockResolvedValue([])
})

describe('ClubService.findMySavedClubs review summaries', () => {
  it('returns existing review counts and ranked keywords for saved clubs', async () => {
    prisma.user_saved_club.findMany.mockResolvedValue([
      { club_id: 'reviewed' },
      { club_id: 'empty' },
    ])
    prisma.club.findMany.mockResolvedValue([
      clubRow('reviewed', '와플스튜디오'),
      clubRow('empty', '후기 없는 동아리'),
    ])
    prisma.user_club_review.findMany.mockResolvedValue([
      { club_id: 'reviewed', review_keyword_ids: ['friendly', 'learning'] },
      { club_id: 'reviewed', review_keyword_ids: ['learning'] },
    ])
    prisma.club_review_keyword.findMany.mockResolvedValue([
      { id: 'friendly', title: '친목', icon_uri: '😊' },
      { id: 'learning', title: '배움', icon_uri: '📚' },
    ])

    const result = await new ClubService().findMySavedClubs('test-user')

    expect(prisma.user_saved_club.findMany).toHaveBeenCalledWith({
      where: { service_user_id: 'test-user' },
      select: { club_id: true },
    })
    expect(prisma.club.findMany).toHaveBeenCalledWith({
      where: { uuid: { in: ['reviewed', 'empty'] }, status: 'APPROVED', deleted_at: null },
    })
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

  it('returns no clubs without querying reviews when the saved list is empty', async () => {
    await expect(new ClubService().findMySavedClubs('test-user')).resolves.toEqual([])

    expect(prisma.club.findMany).not.toHaveBeenCalled()
    expect(prisma.user_club_review.findMany).not.toHaveBeenCalled()
    expect(prisma.club_review_keyword.findMany).not.toHaveBeenCalled()
  })
})
