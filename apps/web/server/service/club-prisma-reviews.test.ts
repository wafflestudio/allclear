import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prisma } = vi.hoisted(() => ({
  prisma: {
    user_club_review: { findMany: vi.fn() },
    club_review_keyword: { findMany: vi.fn() },
  },
}))

vi.mock('../provider', () => ({
  Inject: () => () => undefined,
  InjectRepository: () => () => undefined,
  Service: () => undefined,
}))
vi.mock('../infra/database/prisma', () => ({ getPrismaClient: () => prisma }))

import { ClubService } from './club.service'

const firstClubId = '123e4567-e89b-12d3-a456-426614174000'
const secondClubId = '123e4567-e89b-12d3-a456-426614174001'

beforeEach(() => {
  vi.resetAllMocks()
  prisma.user_club_review.findMany.mockResolvedValue([])
  prisma.club_review_keyword.findMany.mockResolvedValue([])
})

describe('ClubService Prisma review summaries', () => {
  it('skips queries when there are no club IDs', async () => {
    await expect(new ClubService().getClubReviews([])).resolves.toEqual(new Map())
    expect(prisma.user_club_review.findMany).not.toHaveBeenCalled()
    expect(prisma.club_review_keyword.findMany).not.toHaveBeenCalled()
  })

  it('counts reviews and sorts only voted, active keywords by upvotes', async () => {
    prisma.user_club_review.findMany.mockResolvedValue([
      { club_id: firstClubId, review_keyword_ids: ['b', 'a'] },
      { club_id: firstClubId, review_keyword_ids: ['b', 'missing'] },
      { club_id: secondClubId, review_keyword_ids: [] },
    ])
    prisma.club_review_keyword.findMany.mockResolvedValue([
      { id: 'a', title: '키워드 A', icon_uri: 'a.png' },
      { id: 'b', title: '키워드 B', icon_uri: 'b.png' },
      { id: 'c', title: '키워드 C', icon_uri: 'c.png' },
    ])

    const summaries = await new ClubService().getClubReviews([firstClubId, secondClubId])

    expect(prisma.user_club_review.findMany).toHaveBeenCalledWith({
      where: { club_id: { in: [firstClubId, secondClubId] } },
      select: { club_id: true, review_keyword_ids: true },
    })
    expect(prisma.club_review_keyword.findMany).toHaveBeenCalledWith({
      where: { deleted_at: null },
      orderBy: { sort_order: 'asc' },
      select: { id: true, title: true, icon_uri: true },
    })
    expect(summaries.get(firstClubId)).toEqual({
      totalReviews: 2,
      reviewKeywords: [
        { id: 'b', title: '키워드 B', iconUri: 'b.png', totalUpvotes: 2 },
        { id: 'a', title: '키워드 A', iconUri: 'a.png', totalUpvotes: 1 },
      ],
    })
    expect(summaries.get(secondClubId)).toEqual({ totalReviews: 1, reviewKeywords: [] })
  })

  it('returns a zero count for a club without reviews', async () => {
    const summaries = await new ClubService().getClubReviews([firstClubId])
    expect(summaries.get(firstClubId)).toEqual({ totalReviews: 0, reviewKeywords: [] })
  })
})
