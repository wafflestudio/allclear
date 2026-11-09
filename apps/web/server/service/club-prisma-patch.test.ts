import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prisma, tx } = vi.hoisted(() => {
  const tx = {
    $queryRaw: vi.fn(),
    club: { findFirst: vi.fn(), update: vi.fn() },
    club_manager: { findFirst: vi.fn(), update: vi.fn() },
    club_manager_request: { findFirst: vi.fn() },
    user_notification: { deleteMany: vi.fn() },
    club_history: { create: vi.fn() },
  }
  return {
    prisma: {
      $transaction: vi.fn(async (callback) => callback(tx)),
      college_major: { findFirst: vi.fn() },
    },
    tx,
  }
})

vi.mock('../provider', () => ({
  Inject: () => () => undefined,
  InjectRepository: () => () => undefined,
  Service: () => undefined,
}))
vi.mock('../infra/database/prisma', () => ({ getPrismaClient: () => prisma }))

import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../domain/error'
import { ClubService } from './club.service'

const clubUuid = '123e4567-e89b-12d3-a456-426614174000'
const serviceUserId = '123e4567-e89b-12d3-a456-426614174001'
const updatedAt = new Date('2026-10-11T00:00:00.000Z')
const clubRow = (status = 'PENDING') => ({
  id: BigInt(1),
  uuid: clubUuid,
  name: '동아리',
  description: '',
  short_description: '기존 소개',
  introduction: '소개',
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
  article: null,
  article_uploaded_at: null,
  status,
  reject_reason: status === 'REJECTED' ? '반려 사유' : '',
  approved_at: null,
  created_at: new Date('2026-10-01T00:00:00.000Z'),
  updated_at: new Date('2026-10-01T00:00:00.000Z'),
  deleted_at: null,
  sns: '',
})

const setClubRows = (before: ReturnType<typeof clubRow>, after = before) => {
  tx.club.findFirst.mockResolvedValueOnce(before).mockResolvedValueOnce(after)
}

beforeEach(() => {
  vi.resetAllMocks()
  prisma.$transaction.mockImplementation(async (callback) => callback(tx))
  tx.$queryRaw.mockResolvedValue([{ uuid: clubUuid }])
  tx.club_manager.findFirst.mockResolvedValue({ id: 7 })
  tx.club_manager_request.findFirst.mockResolvedValue(null)
  setClubRows(clubRow())
})

describe('ClubService Prisma registration patch', () => {
  it('locks the club row and updates its data inside the transaction', async () => {
    tx.club.findFirst.mockReset()
    setClubRows(clubRow(), { ...clubRow(), short_description: '새 소개', updated_at: updatedAt })

    const result = await new ClubService().patchManagedClub(clubUuid, serviceUserId, {
      club_data: { short_description: '새 소개' },
    })

    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), { timeout: 30_000 })
    const [sql, uuid] = tx.$queryRaw.mock.calls[0]
    expect(sql.join('')).toContain('FOR UPDATE')
    expect(uuid).toBe(clubUuid)
    expect(tx.club.update).toHaveBeenCalledWith({
      where: { uuid: clubUuid },
      data: { short_description: '새 소개', updated_at: expect.any(Date) },
    })
    expect(result).toEqual({ clubUuid, updatedAt: updatedAt.toISOString() })
    expect(tx.club_history.create).not.toHaveBeenCalled()
  })

  it('rejects a missing club or manager before writing', async () => {
    tx.$queryRaw.mockResolvedValueOnce([])
    await expect(
      new ClubService().patchManagedClub(clubUuid, serviceUserId, { resubmit: true }),
    ).rejects.toBeInstanceOf(NotFoundError)
    expect(tx.club.findFirst).not.toHaveBeenCalled()

    tx.club_manager.findFirst.mockResolvedValueOnce(null)
    await expect(
      new ClubService().patchManagedClub(clubUuid, serviceUserId, {
        club_data: { name: '변경' },
      }),
    ).rejects.toBeInstanceOf(ForbiddenError)
    expect(tx.club.update).not.toHaveBeenCalled()
  })

  it('requires resubmit before changing a rejected registration', async () => {
    tx.club.findFirst.mockReset()
    setClubRows(clubRow('REJECTED'))
    await expect(
      new ClubService().patchManagedClub(clubUuid, serviceUserId, {
        club_data: { short_description: '새 소개' },
        manager_data: { phone: '010-9876-5432' },
      }),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(tx.club_manager.update).not.toHaveBeenCalled()
    expect(tx.club.update).not.toHaveBeenCalled()
  })

  it('resubmits a rejected registration and removes the rejection notification', async () => {
    tx.club.findFirst.mockReset()
    setClubRows(clubRow('REJECTED'), { ...clubRow(), updated_at: updatedAt })
    await new ClubService().patchManagedClub(clubUuid, serviceUserId, { resubmit: true })

    expect(tx.club.update).toHaveBeenCalledWith({
      where: { uuid: clubUuid },
      data: { status: 'PENDING', reject_reason: '', updated_at: expect.any(Date) },
    })
    expect(tx.user_notification.deleteMany).toHaveBeenCalledWith({
      where: {
        source_type: 'CLUB',
        source_id: clubUuid,
        type: 'CLUB_REGISTRATION_REJECTED',
      },
    })
    expect(tx.club_history.create).not.toHaveBeenCalled()
  })

  it('records before and after data for an approved club', async () => {
    tx.club.findFirst.mockReset()
    setClubRows(clubRow('APPROVED'), {
      ...clubRow('APPROVED'),
      short_description: '새 소개',
      updated_at: updatedAt,
    })
    await new ClubService().patchManagedClub(clubUuid, serviceUserId, {
      club_data: { short_description: '새 소개' },
    })

    expect(tx.club_history.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        club_id: clubUuid,
        service_user_id: serviceUserId,
        changed_fields: ['short_description'],
        before_data: expect.objectContaining({ short_description: '기존 소개' }),
        after_data: expect.objectContaining({ short_description: '새 소개' }),
      }),
    })
  })

  it('maps affiliation and JSON fields to their Prisma columns', async () => {
    prisma.college_major.findFirst.mockResolvedValue({ id: 9 })
    await new ClubService().patchManagedClub(clubUuid, serviceUserId, {
      club_data: {
        affiliation: '컴퓨터공학부',
        has_dongbang: true,
        sns_urls: ['https://example.com'],
        activity_image_urls: ['https://example.com/activity.png'],
      },
    })

    expect(prisma.college_major.findFirst).toHaveBeenCalledWith({
      where: { major: '컴퓨터공학부', deleted_at: null },
      select: { id: true },
    })
    expect(tx.club.update).toHaveBeenCalledWith({
      where: { uuid: clubUuid },
      data: {
        affiliation_type: '소속동아리',
        college_major_id: 9,
        has_dongbang: true,
        sns_urls: ['https://example.com'],
        activity_image_urls: ['https://example.com/activity.png'],
        updated_at: expect.any(Date),
      },
    })
  })

  it('updates manager contact details only for a registration', async () => {
    await new ClubService().patchManagedClub(clubUuid, serviceUserId, {
      manager_data: { phone: '010-9876-5432' },
    })
    expect(tx.club_manager.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { phone: '010-9876-5432', updated_at: expect.any(Date) },
    })
    expect(tx.club.update).not.toHaveBeenCalled()

    setClubRows(clubRow())
    tx.club_manager_request.findFirst.mockResolvedValueOnce({ id: BigInt(1) })
    await expect(
      new ClubService().patchManagedClub(clubUuid, serviceUserId, {
        manager_data: { phone: '010-9876-5432' },
      }),
    ).rejects.toBeInstanceOf(ForbiddenError)
  })

  it('rejects an empty patch and disallows resubmitting a pending club', async () => {
    await expect(
      new ClubService().patchManagedClub(clubUuid, serviceUserId, {}),
    ).rejects.toBeInstanceOf(BadRequestError)
    await expect(
      new ClubService().patchManagedClub(clubUuid, serviceUserId, { resubmit: true }),
    ).rejects.toBeInstanceOf(ConflictError)
  })
})
