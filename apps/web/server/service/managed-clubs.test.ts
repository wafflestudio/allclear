import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prisma } = vi.hoisted(() => ({
  prisma: {
    club_manager: { findMany: vi.fn() },
    club_manager_request: { findMany: vi.fn() },
    club: { findMany: vi.fn() },
    club_recruitment: { groupBy: vi.fn() },
    college_major: { findMany: vi.fn() },
  },
}))

vi.mock('../provider', () => ({
  Inject: () => () => undefined,
  InjectRepository: () => () => undefined,
  Service: () => undefined,
}))
vi.mock('../infra/database/prisma', () => ({ getPrismaClient: () => prisma }))

import { ClubService } from './club.service'

const userId = '123e4567-e89b-12d3-a456-426614174009'
const clubRow = (uuid: string, status = 'APPROVED', updatedAt = '2026-07-26T00:00:00.000Z') => ({
  id: BigInt(1),
  uuid,
  name: `Club ${uuid}`,
  description: '',
  short_description: '',
  introduction: '',
  type: '교내',
  category: '학술',
  affiliation_type: '중앙동아리',
  college_major_id: null,
  recruit_type: '상시',
  is_official_verified: false,
  verified_at: null,
  has_dongbang: false,
  dongbang_location: '',
  min_activity_period: 0,
  active_member_count: 0,
  founded_at: null,
  sns_urls: [],
  activity_image_urls: [],
  image_uri: '',
  article: '',
  article_uploaded_at: null,
  status,
  reject_reason: '',
  approved_at: null,
  created_at: new Date('2026-07-01T00:00:00.000Z'),
  updated_at: new Date(updatedAt),
  deleted_at: null,
  sns: '',
})

beforeEach(() => {
  vi.resetAllMocks()
  prisma.club_manager.findMany.mockResolvedValue([])
  prisma.club_manager_request.findMany.mockResolvedValue([])
  prisma.club.findMany.mockResolvedValue([])
  prisma.club_recruitment.groupBy.mockResolvedValue([])
  prisma.college_major.findMany.mockResolvedValue([])
})

describe('ClubService.findAllManagedByUser with Prisma', () => {
  it('keeps managed and pending request clubs and reports whether each has a manager', async () => {
    const managedId = '123e4567-e89b-12d3-a456-426614174000'
    const occupiedId = '123e4567-e89b-12d3-a456-426614174001'
    const vacantId = '123e4567-e89b-12d3-a456-426614174002'
    prisma.club_manager.findMany
      .mockResolvedValueOnce([{ club_id: managedId }])
      .mockResolvedValueOnce([{ club_id: managedId }, { club_id: occupiedId }])
    prisma.club_manager_request.findMany.mockResolvedValue([
      { id: BigInt(1), club_id: occupiedId, status: 'PENDING' },
      { id: BigInt(2), club_id: vacantId, status: 'PENDING' },
    ])
    prisma.club.findMany.mockResolvedValue([
      clubRow(managedId),
      clubRow(occupiedId),
      clubRow(vacantId),
    ])

    const result = await new ClubService().findAllManagedByUser(userId)

    expect(
      result.map(({ uuid, managementStatus, hasManager }) => ({
        uuid,
        managementStatus,
        hasManager,
      })),
    ).toEqual([
      { uuid: managedId, managementStatus: 'APPROVED', hasManager: true },
      { uuid: occupiedId, managementStatus: 'MANAGER_REQUEST_PENDING', hasManager: true },
      { uuid: vacantId, managementStatus: 'MANAGER_REQUEST_PENDING', hasManager: false },
    ])
    expect(prisma.club_manager.findMany).toHaveBeenNthCalledWith(2, {
      where: { club_id: { in: [managedId, occupiedId, vacantId] }, deleted_at: null },
      select: { club_id: true },
    })
  })

  it('sorts approved clubs by the later of club and recruitment updates', async () => {
    const firstId = '123e4567-e89b-12d3-a456-426614174003'
    const secondId = '123e4567-e89b-12d3-a456-426614174004'
    prisma.club_manager.findMany
      .mockResolvedValueOnce([{ club_id: firstId }, { club_id: secondId }])
      .mockResolvedValueOnce([{ club_id: firstId }, { club_id: secondId }])
    prisma.club.findMany.mockResolvedValue([
      clubRow(firstId, 'APPROVED', '2026-07-10T00:00:00.000Z'),
      clubRow(secondId, 'APPROVED', '2026-07-20T00:00:00.000Z'),
    ])
    prisma.club_recruitment.groupBy.mockResolvedValue([
      { club_id: firstId, _max: { updated_at: new Date('2026-07-30T00:00:00.000Z') } },
    ])

    const result = await new ClubService().findAllManagedByUser(userId)

    expect(result.map((club) => club.uuid)).toEqual([firstId, secondId])
    expect(prisma.club_recruitment.groupBy).toHaveBeenCalledWith({
      by: ['club_id'],
      where: { club_id: { in: [firstId, secondId] }, deleted_at: null },
      _max: { updated_at: true },
    })
  })

  it('uses only the latest request for each club and keeps rejected ahead of pending', async () => {
    const rejectedId = '123e4567-e89b-12d3-a456-426614174005'
    const pendingId = '123e4567-e89b-12d3-a456-426614174006'
    prisma.club_manager_request.findMany.mockResolvedValue([
      { id: BigInt(9), club_id: rejectedId, status: 'REJECTED' },
      { id: BigInt(8), club_id: rejectedId, status: 'PENDING' },
      { id: BigInt(7), club_id: pendingId, status: 'PENDING' },
    ])
    prisma.club.findMany.mockResolvedValue([clubRow(rejectedId), clubRow(pendingId)])

    const result = await new ClubService().findAllManagedByUser(userId)

    expect(
      result.map(({ uuid, managementStatus, managerRequestId }) => ({
        uuid,
        managementStatus,
        managerRequestId,
      })),
    ).toEqual([
      { uuid: rejectedId, managementStatus: 'MANAGER_REQUEST_REJECTED', managerRequestId: 9 },
      { uuid: pendingId, managementStatus: 'MANAGER_REQUEST_PENDING', managerRequestId: 7 },
    ])
    expect(prisma.club_manager_request.findMany).toHaveBeenCalledWith({
      where: { service_user_id: userId },
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      select: { id: true, club_id: true, status: true },
    })
  })

  it('skips club and recruitment queries when there are no managed clubs or requests', async () => {
    await expect(new ClubService().findAllManagedByUser(userId)).resolves.toEqual([])
    expect(prisma.club.findMany).not.toHaveBeenCalled()
    expect(prisma.club_recruitment.groupBy).not.toHaveBeenCalled()
  })
})
