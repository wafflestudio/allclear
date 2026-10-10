import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prisma } = vi.hoisted(() => ({
  prisma: {
    $queryRaw: vi.fn(),
    club: { findMany: vi.fn() },
    college_major: { findMany: vi.fn() },
    user_club_review: { findMany: vi.fn() },
    user_saved_club: { findMany: vi.fn(), create: vi.fn(), deleteMany: vi.fn() },
  },
}))

vi.mock('../provider', () => ({
  Inject: () => () => undefined,
  InjectRepository: () => () => undefined,
  Service: () => undefined,
}))
vi.mock('../infra/database/prisma', () => ({ getPrismaClient: () => prisma }))

import { ClubService } from './club.service'

const clubRow = (uuid: string, collegeMajorId: number | null = null) => ({
  id: BigInt(1),
  uuid,
  name: `Club ${uuid}`,
  description: '',
  short_description: '',
  introduction: null,
  type: '교내',
  category: '학술',
  affiliation_type: '중앙',
  college_major_id: collegeMajorId,
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
  approved_at: null,
  created_at: new Date('2026-10-01T00:00:00.000Z'),
  updated_at: new Date('2026-10-01T00:00:00.000Z'),
  deleted_at: null,
  sns: '',
})

const createService = () => {
  const service = new ClubService()
  const getClubReviews = vi.fn().mockResolvedValue(new Map())
  const getPublicClub = vi.fn().mockResolvedValue({ uuid: 'club-1' })
  Object.defineProperty(service, 'getClubReviews', { value: getClubReviews })
  Object.defineProperty(service, 'clubAccessService', { value: { getPublicClub } })
  Object.defineProperty(service, 'userActivityLogRepository', {
    value: { insert: vi.fn().mockResolvedValue(undefined) },
  })
  return { service, getClubReviews, getPublicClub }
}

beforeEach(() => {
  vi.clearAllMocks()
  prisma.club.findMany.mockResolvedValue([])
  prisma.college_major.findMany.mockResolvedValue([])
  prisma.user_club_review.findMany.mockResolvedValue([])
  prisma.user_saved_club.findMany.mockResolvedValue([])
  prisma.$queryRaw.mockResolvedValue([])
})

describe('ClubService Prisma list and save methods', () => {
  it('lists public clubs by category and loads only active college majors', async () => {
    const { service, getClubReviews } = createService()
    prisma.club.findMany.mockResolvedValue([clubRow('club-1', 3)])
    prisma.college_major.findMany.mockResolvedValue([{ id: 3, college: 'College', major: 'Major' }])
    const clubs = await service.findByCategory('학술')
    expect(prisma.club.findMany).toHaveBeenCalledWith({
      where: { category: '학술', status: 'APPROVED', deleted_at: null },
    })
    expect(prisma.college_major.findMany).toHaveBeenCalledWith({
      where: { id: { in: [3] }, deleted_at: null },
      select: { id: true, college: true, major: true },
    })
    expect(getClubReviews).toHaveBeenCalledWith(['club-1'])
    expect(clubs[0]).toMatchObject({
      uuid: 'club-1',
      collegeMajor: { id: 3, college: 'College', major: 'Major' },
    })
  })

  it('finds only public, non-deleted clubs reviewed or saved by the user', async () => {
    const { service } = createService()
    prisma.user_club_review.findMany.mockResolvedValue([{ club_id: 'club-1' }])
    prisma.user_saved_club.findMany.mockResolvedValue([{ club_id: 'club-1' }])
    prisma.club.findMany.mockResolvedValue([clubRow('club-1')])
    expect((await service.findClubsReviewedByMe('user-1')).map((club) => club.uuid)).toEqual([
      'club-1',
    ])
    expect((await service.findMySavedClubs('user-1')).map((club) => club.uuid)).toEqual(['club-1'])
    expect(prisma.club.findMany).toHaveBeenCalledWith({
      where: { uuid: { in: ['club-1'] }, status: 'APPROVED', deleted_at: null },
    })
  })

  it('skips the club query when a user has no saved clubs', async () => {
    const { service } = createService()
    await expect(service.findMySavedClubs('user-1')).resolves.toEqual([])
    expect(prisma.club.findMany).not.toHaveBeenCalled()
  })

  it('preserves latest upload ordering with null timestamps last', async () => {
    const { service } = createService()
    prisma.club.findMany.mockResolvedValue([clubRow('club-1')])
    await service.findLatestUploaded(5)
    expect(prisma.club.findMany).toHaveBeenCalledWith({
      where: { status: 'APPROVED', deleted_at: null },
      orderBy: { article_uploaded_at: { sort: 'desc', nulls: 'last' } },
      take: 5,
    })
  })

  it('keeps the database sample order for random recommendations', async () => {
    const { service } = createService()
    prisma.$queryRaw.mockResolvedValue([{ uuid: 'club-2' }, { uuid: 'club-1' }])
    prisma.club.findMany.mockResolvedValue([clubRow('club-1'), clubRow('club-2')])
    const clubs = await service.findRandomRecommendations(2)
    expect(clubs.map((club) => club.uuid)).toEqual(['club-2', 'club-1'])
    const [sql, status, limit] = prisma.$queryRaw.mock.calls[0]
    expect(sql.join('')).toContain('ORDER BY RANDOM()')
    expect([status, limit]).toEqual(['APPROVED', 2])
  })

  it('checks public visibility before saving and deletes by both IDs', async () => {
    const { service, getPublicClub } = createService()
    await service.saveClubToMyCollection('user-1', 'club-1')
    expect(getPublicClub).toHaveBeenCalledWith('club-1')
    expect(prisma.user_saved_club.create).toHaveBeenCalledWith({
      data: { service_user_id: 'user-1', club_id: 'club-1' },
    })
    await service.unsaveClubFromMyCollection('user-1', 'club-1')
    expect(prisma.user_saved_club.deleteMany).toHaveBeenCalledWith({
      where: { service_user_id: 'user-1', club_id: 'club-1' },
    })
  })
})
