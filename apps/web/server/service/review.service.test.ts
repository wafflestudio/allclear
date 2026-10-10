import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prisma } = vi.hoisted(() => ({
  prisma: {
    user_club_review: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    club_review_keyword_category: { findMany: vi.fn() },
    club_review_keyword: { findMany: vi.fn() },
    $queryRaw: vi.fn(),
  },
}))

vi.mock('../provider', () => ({
  Service: () => undefined,
  Inject: () => () => undefined,
  InjectRepository: () => () => undefined,
}))
vi.mock('../infra/database/prisma', () => ({ getPrismaClient: () => prisma }))

import { ReviewService } from './review.service'

const createService = () => {
  const service = new ReviewService()
  const getPublicClub = vi.fn().mockResolvedValue({ uuid: 'club-id' })
  Object.defineProperty(service, 'clubAccessService', { value: { getPublicClub } })
  return { service, getPublicClub }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ReviewService with Prisma', () => {
  it('creates a review with the database default keyword list', async () => {
    const { service, getPublicClub } = createService()
    prisma.user_club_review.findUnique.mockResolvedValue(null)
    prisma.user_club_review.create.mockResolvedValue({ id: 1 })

    await service.reviewClub('service-user-id', 'club-id', {})

    expect(getPublicClub).toHaveBeenCalledWith('club-id')
    expect(prisma.user_club_review.findUnique).toHaveBeenCalledWith({
      where: {
        club_id_service_user_id: { club_id: 'club-id', service_user_id: 'service-user-id' },
      },
    })
    expect(prisma.user_club_review.create).toHaveBeenCalledWith({
      data: { service_user_id: 'service-user-id', club_id: 'club-id', review_keyword_ids: [] },
    })
  })

  it('updates changed keywords and leaves an unchanged review alone', async () => {
    const { service } = createService()
    prisma.user_club_review.findUnique.mockResolvedValue({ review_keyword_ids: ['old-id'] })
    prisma.user_club_review.update.mockResolvedValue({ id: 1 })

    await service.reviewClub('service-user-id', 'club-id', { reviewKeywordIds: ['new-id'] })
    expect(prisma.user_club_review.update).toHaveBeenCalledWith({
      where: {
        club_id_service_user_id: { club_id: 'club-id', service_user_id: 'service-user-id' },
      },
      data: { review_keyword_ids: ['new-id'], updated_at: expect.any(Date) },
    })

    await service.reviewClub('service-user-id', 'club-id', {})
    expect(prisma.user_club_review.update).toHaveBeenCalledTimes(1)
  })

  it('groups active keywords in sort order and maps category IDs to numbers', async () => {
    const { service } = createService()
    prisma.club_review_keyword_category.findMany.mockResolvedValue([
      { id: BigInt(2), title: 'Second' },
      { id: BigInt(1), title: 'First' },
    ])
    prisma.club_review_keyword.findMany.mockResolvedValue([
      { id: 'keyword-1', category_id: BigInt(1), title: 'One', icon_uri: '/one' },
      { id: 'keyword-2', category_id: BigInt(2), title: 'Two', icon_uri: '/two' },
      { id: 'keyword-3', category_id: BigInt(1), title: 'Three', icon_uri: '/three' },
    ])

    await expect(service.getKeywords()).resolves.toEqual([
      { id: 2, title: 'Second', keywords: [{ id: 'keyword-2', title: 'Two', iconUri: '/two' }] },
      {
        id: 1,
        title: 'First',
        keywords: [
          { id: 'keyword-1', title: 'One', iconUri: '/one' },
          { id: 'keyword-3', title: 'Three', iconUri: '/three' },
        ],
      },
    ])
    expect(prisma.club_review_keyword_category.findMany).toHaveBeenCalledWith({
      where: { deleted_at: null },
      orderBy: { sort_order: 'asc' },
    })
    expect(prisma.club_review_keyword.findMany).toHaveBeenCalledWith({
      where: { category_id: { in: [BigInt(2), BigInt(1)] }, deleted_at: null },
      orderBy: { sort_order: 'asc' },
    })
  })

  it('rejects a category ID that cannot be represented by the API number type', async () => {
    const { service } = createService()
    prisma.club_review_keyword_category.findMany.mockResolvedValue([
      { id: BigInt('9007199254740993'), title: 'Too large' },
    ])
    prisma.club_review_keyword.findMany.mockResolvedValue([])
    await expect(service.getKeywords()).rejects.toBeInstanceOf(RangeError)
  })

  it('maps a review timestamp to the existing response format', async () => {
    const { service } = createService()
    prisma.user_club_review.findUnique.mockResolvedValue({
      review_keyword_ids: ['keyword-id'],
      created_at: new Date('2026-10-01T00:00:00Z'),
      updated_at: new Date('2026-10-02T00:00:00Z'),
    })
    await expect(service.getMyReview('service-user-id', 'club-id')).resolves.toEqual({
      reviewKeywordIds: ['keyword-id'],
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-02T00:00:00.000Z',
    })
  })

  it('keeps ranking SQL parameterized and numbers the returned rows', async () => {
    const { service } = createService()
    prisma.$queryRaw.mockResolvedValue([
      { club_id: 'club-1', club_name: 'Club One', category: 'Music' },
      { club_id: 'club-2', club_name: 'Club Two', category: 'Sport' },
    ])
    await expect(service.getClubRankings(2)).resolves.toEqual([
      { clubId: 'club-1', clubName: 'Club One', category: 'Music', ranking: 1 },
      { clubId: 'club-2', clubName: 'Club Two', category: 'Sport', ranking: 2 },
    ])
    const [sql, limit] = prisma.$queryRaw.mock.calls[0]
    expect(sql.join('?')).toContain('LIMIT ?')
    expect(limit).toBe(2)
  })
})
