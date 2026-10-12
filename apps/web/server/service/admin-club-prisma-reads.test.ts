import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prisma } = vi.hoisted(() => ({
  prisma: {
    club: { findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn() },
    club_manager: { findMany: vi.fn(), findFirst: vi.fn() },
    college_major: { findMany: vi.fn(), findFirst: vi.fn() },
  },
}))

vi.mock('../provider', () => ({
  InjectRepository: () => () => undefined,
  Service: () => undefined,
}))
vi.mock('../infra/database/prisma', () => ({ getPrismaClient: () => prisma }))

import { AdminClubService } from './admin-club.service'

const clubUuid = '123e4567-e89b-12d3-a456-426614174000'
const clubRow = {
  uuid: clubUuid,
  name: '동아리',
  status: 'PENDING',
  category: '학술',
  affiliation_type: '소속동아리',
  college_major_id: 4,
  short_description: '한 줄 소개',
  created_at: new Date('2026-10-01T00:00:00.000Z'),
  type: '교내',
  image_uri: 'https://example.com/image.png',
  recruit_type: '상시',
  min_activity_period: 1,
  has_dongbang: false,
  dongbang_location: null,
  sns_urls: ['https://example.com'],
  introduction: '소개',
  activity_image_urls: ['https://example.com/activity.png'],
  reject_reason: null,
}

beforeEach(() => {
  vi.resetAllMocks()
  prisma.club.findMany.mockResolvedValue([])
  prisma.club.count.mockResolvedValue(0)
  prisma.club.findFirst.mockResolvedValue(null)
  prisma.club_manager.findMany.mockResolvedValue([])
  prisma.club_manager.findFirst.mockResolvedValue(null)
  prisma.college_major.findMany.mockResolvedValue([])
  prisma.college_major.findFirst.mockResolvedValue(null)
})

describe('AdminClubService Prisma club reads', () => {
  it('filters and paginates clubs while loading active managers and colleges', async () => {
    prisma.club.findMany.mockResolvedValue([clubRow])
    prisma.club.count.mockResolvedValue(12)
    prisma.club_manager.findMany.mockResolvedValue([
      { club_id: clubUuid, name: '홍길동', phone: '010-1234-5678', student_id: '2021-12345' },
    ])
    prisma.college_major.findMany.mockResolvedValue([
      { id: 4, college: '공과대학', major: '컴퓨터공학부' },
    ])

    const result = await new AdminClubService().getAdminClubs({
      status: 'PENDING',
      affiliation_type: '소속동아리',
      offset: 20,
      limit: 10,
    })

    const where = { deleted_at: null, status: 'PENDING', affiliation_type: '소속동아리' }
    expect(prisma.club.findMany).toHaveBeenCalledWith({
      where,
      orderBy: [{ created_at: 'desc' }, { uuid: 'asc' }],
      skip: 20,
      take: 10,
    })
    expect(prisma.club.count).toHaveBeenCalledWith({ where })
    expect(prisma.club_manager.findMany).toHaveBeenCalledWith({
      where: { club_id: { in: [clubUuid] }, deleted_at: null },
      select: { club_id: true, name: true, phone: true, student_id: true },
    })
    expect(prisma.college_major.findMany).toHaveBeenCalledWith({
      where: { id: { in: [4] }, deleted_at: null },
      select: { id: true, college: true, major: true },
    })
    expect(result).toEqual({
      total_count: 12,
      clubs: [
        {
          uuid: clubUuid,
          name: '동아리',
          status: 'PENDING',
          category: '학술',
          affiliation: '컴퓨터공학부',
          short_description: '한 줄 소개',
          created_at: clubRow.created_at.toISOString(),
          manager: { name: '홍길동', phone: '010-1234-5678', student_id: '2021-12345' },
        },
      ],
    })
  })

  it('preserves the exclusion filter priority and skips relations for an empty page', async () => {
    prisma.club.count.mockResolvedValue(3)
    const result = await new AdminClubService().getAdminClubs({
      affiliation_type: '소속동아리',
      exclude_affiliation_type: '중앙동아리',
      offset: 100,
      limit: 20,
    })

    expect(prisma.club.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { deleted_at: null, affiliation_type: { not: '중앙동아리' } },
      }),
    )
    expect(result).toEqual({ total_count: 3, clubs: [] })
    expect(prisma.club_manager.findMany).not.toHaveBeenCalled()
    expect(prisma.college_major.findMany).not.toHaveBeenCalled()
  })

  it('returns a club detail with Prisma JSON and timestamp fields', async () => {
    prisma.club.findFirst.mockResolvedValue(clubRow)
    prisma.club_manager.findFirst.mockResolvedValue({
      name: '홍길동',
      phone: '010-1234-5678',
      student_id: '2021-12345',
      service_user_id: '123e4567-e89b-12d3-a456-426614174001',
    })
    prisma.college_major.findFirst.mockResolvedValue({ college: '공과대학', major: null })

    const detail = await new AdminClubService().getAdminClubDetail(clubUuid)

    expect(prisma.club.findFirst).toHaveBeenCalledWith({
      where: { uuid: clubUuid, deleted_at: null },
    })
    expect(prisma.club_manager.findFirst).toHaveBeenCalledWith({
      where: { club_id: clubUuid, deleted_at: null },
      select: { name: true, phone: true, student_id: true, service_user_id: true },
    })
    expect(detail.club_data).toMatchObject({
      affiliation: '공과대학',
      college_major_id: 4,
      dongbang_location: '',
      sns_urls: ['https://example.com'],
      activity_image_urls: ['https://example.com/activity.png'],
      created_at: clubRow.created_at.toISOString(),
    })
    expect(detail.manager_data).toMatchObject({ name: '홍길동', student_id: '2021-12345' })
  })

  it('does not query relations for a missing club', async () => {
    await expect(new AdminClubService().getAdminClubDetail(clubUuid)).rejects.toThrow(
      'club not found',
    )
    expect(prisma.club_manager.findFirst).not.toHaveBeenCalled()
    expect(prisma.college_major.findFirst).not.toHaveBeenCalled()
  })
})
