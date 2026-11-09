import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prisma, tx } = vi.hoisted(() => {
  const tx = {
    $queryRaw: vi.fn(),
    club: { updateMany: vi.fn() },
    club_manager: { findMany: vi.fn() },
    user_notification: { deleteMany: vi.fn(), createMany: vi.fn() },
  }
  return { prisma: { $transaction: vi.fn() }, tx }
})

vi.mock('../provider', () => ({
  InjectRepository: () => () => undefined,
  Service: () => undefined,
}))
vi.mock('../infra/database/prisma', () => ({ getPrismaClient: () => prisma }))

import { AdminClubService } from './admin-club.service'

const clubUuid = '123e4567-e89b-12d3-a456-426614174000'
const managerId = '123e4567-e89b-12d3-a456-426614174001'

beforeEach(() => {
  vi.resetAllMocks()
  prisma.$transaction.mockImplementation(async (callback) => callback(tx))
  tx.$queryRaw.mockResolvedValue([{ status: 'PENDING' }])
  tx.club_manager.findMany.mockResolvedValue([{ service_user_id: managerId }])
})

describe('AdminClubService Prisma club status updates', () => {
  it('approves a club and notifies its active manager in the same transaction', async () => {
    const result = await new AdminClubService().updateAdminClubStatus(clubUuid, {
      status: 'APPROVED',
      is_official_verified: true,
    })

    expect(prisma.$transaction).toHaveBeenCalledOnce()
    const [sql, uuid] = tx.$queryRaw.mock.calls[0]
    expect(sql.join('')).toContain('FOR UPDATE')
    expect(uuid).toBe(clubUuid)
    const update = tx.club.updateMany.mock.calls[0][0]
    expect(update).toEqual({
      where: { uuid: clubUuid, deleted_at: null },
      data: {
        status: 'APPROVED',
        approved_at: expect.any(Date),
        reject_reason: '',
        is_official_verified: true,
        verified_at: expect.any(Date),
        updated_at: expect.any(Date),
      },
    })
    expect(update.data.approved_at).toBe(update.data.updated_at)
    expect(update.data.verified_at).toBe(update.data.updated_at)
    expect(tx.club_manager.findMany).toHaveBeenCalledWith({
      where: { club_id: clubUuid, deleted_at: null },
      select: { service_user_id: true },
    })
    expect(tx.user_notification.createMany).toHaveBeenCalledWith({
      data: [
        {
          service_user_id: managerId,
          type: 'CLUB_REGISTRATION_APPROVED',
          club_id: clubUuid,
          source_type: 'CLUB',
          source_id: clubUuid,
        },
      ],
    })
    expect(result).toEqual({
      club_uuid: clubUuid,
      status: 'APPROVED',
      processed_at: update.data.updated_at.toISOString(),
    })
  })

  it('trims the rejection reason and includes it in notification metadata', async () => {
    tx.$queryRaw.mockResolvedValueOnce([{ status: 'APPROVED' }])
    await new AdminClubService().updateAdminClubStatus(clubUuid, {
      status: 'REJECTED',
      reject_reason: '  서류 부족  ',
      is_official_verified: true,
    })

    expect(tx.club.updateMany).toHaveBeenCalledWith({
      where: { uuid: clubUuid, deleted_at: null },
      data: {
        status: 'REJECTED',
        approved_at: null,
        reject_reason: '서류 부족',
        is_official_verified: false,
        verified_at: null,
        updated_at: expect.any(Date),
      },
    })
    expect(tx.user_notification.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          type: 'CLUB_REGISTRATION_REJECTED',
          metadata: { rejectReason: '서류 부족' },
        }),
      ],
    })
  })

  it('resets verification and removes result notifications when returning to pending', async () => {
    tx.$queryRaw.mockResolvedValueOnce([{ status: 'REJECTED' }])
    await new AdminClubService().updateAdminClubStatus(clubUuid, {
      status: 'PENDING',
      is_official_verified: false,
    })

    expect(tx.club.updateMany).toHaveBeenCalledWith({
      where: { uuid: clubUuid, deleted_at: null },
      data: {
        status: 'PENDING',
        approved_at: null,
        reject_reason: '',
        is_official_verified: false,
        verified_at: null,
        updated_at: expect.any(Date),
      },
    })
    expect(tx.user_notification.deleteMany).toHaveBeenCalledWith({
      where: {
        source_type: 'CLUB',
        source_id: clubUuid,
        type: { in: ['CLUB_REGISTRATION_APPROVED', 'CLUB_REGISTRATION_REJECTED'] },
      },
    })
    expect(tx.user_notification.createMany).not.toHaveBeenCalled()
  })

  it('does not send another notification when the status is unchanged', async () => {
    tx.$queryRaw.mockResolvedValueOnce([{ status: 'APPROVED' }])
    await new AdminClubService().updateAdminClubStatus(clubUuid, {
      status: 'APPROVED',
      is_official_verified: false,
    })
    expect(tx.club.updateMany).toHaveBeenCalledOnce()
    expect(tx.club_manager.findMany).not.toHaveBeenCalled()
    expect(tx.user_notification.createMany).not.toHaveBeenCalled()
  })

  it('does not write when the club is missing', async () => {
    tx.$queryRaw.mockResolvedValueOnce([])
    await expect(
      new AdminClubService().updateAdminClubStatus(clubUuid, {
        status: 'APPROVED',
        is_official_verified: false,
      }),
    ).rejects.toThrow('club not found')
    expect(tx.club.updateMany).not.toHaveBeenCalled()
    expect(tx.user_notification.createMany).not.toHaveBeenCalled()
  })
})
