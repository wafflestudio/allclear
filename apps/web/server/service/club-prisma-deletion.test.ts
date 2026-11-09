import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prisma, tx } = vi.hoisted(() => {
  const tx = {
    club: { findFirst: vi.fn(), updateMany: vi.fn() },
    club_manager: { findFirst: vi.fn(), updateMany: vi.fn() },
    user_notification: { deleteMany: vi.fn() },
  }
  return { prisma: { $transaction: vi.fn(async (callback) => callback(tx)) }, tx }
})

vi.mock('../provider', () => ({
  Inject: () => () => undefined,
  InjectRepository: () => () => undefined,
  Service: () => undefined,
}))
vi.mock('../infra/database/prisma', () => ({ getPrismaClient: () => prisma }))

import { ConflictError, ForbiddenError, NotFoundError } from '../domain/error'
import { ClubService } from './club.service'

const clubUuid = '123e4567-e89b-12d3-a456-426614174000'
const serviceUserId = '123e4567-e89b-12d3-a456-426614174001'

beforeEach(() => {
  vi.clearAllMocks()
  tx.club.findFirst.mockResolvedValue({ status: 'PENDING' })
  tx.club_manager.findFirst.mockResolvedValue({ id: 1 })
})

describe('ClubService Prisma registration deletion', () => {
  it('soft deletes the club and manager and removes registration notifications atomically', async () => {
    await new ClubService().deleteManagedClub(clubUuid, serviceUserId)

    expect(prisma.$transaction).toHaveBeenCalledOnce()
    expect(tx.club.findFirst).toHaveBeenCalledWith({
      where: { uuid: clubUuid, deleted_at: null },
      select: { status: true },
    })
    expect(tx.club_manager.findFirst).toHaveBeenCalledWith({
      where: { club_id: clubUuid, service_user_id: serviceUserId, deleted_at: null },
      select: { id: true },
    })
    expect(tx.user_notification.deleteMany).toHaveBeenCalledWith({
      where: {
        source_type: 'CLUB',
        source_id: clubUuid,
        type: { in: ['CLUB_REGISTRATION_APPROVED', 'CLUB_REGISTRATION_REJECTED'] },
      },
    })
    const managerUpdate = tx.club_manager.updateMany.mock.calls[0][0]
    const clubUpdate = tx.club.updateMany.mock.calls[0][0]
    expect(managerUpdate).toMatchObject({ where: { club_id: clubUuid, deleted_at: null } })
    expect(clubUpdate).toMatchObject({ where: { uuid: clubUuid, deleted_at: null } })
    expect(managerUpdate.data.deleted_at).toBeInstanceOf(Date)
    expect(managerUpdate.data.updated_at).toBe(managerUpdate.data.deleted_at)
    expect(clubUpdate.data.deleted_at).toBe(managerUpdate.data.deleted_at)
  })

  it('does not write when the club is missing', async () => {
    tx.club.findFirst.mockResolvedValueOnce(null)
    await expect(
      new ClubService().deleteManagedClub(clubUuid, serviceUserId),
    ).rejects.toBeInstanceOf(NotFoundError)
    expect(tx.club_manager.findFirst).not.toHaveBeenCalled()
    expect(tx.user_notification.deleteMany).not.toHaveBeenCalled()
  })

  it('does not write when the requester is not the active manager', async () => {
    tx.club_manager.findFirst.mockResolvedValueOnce(null)
    await expect(
      new ClubService().deleteManagedClub(clubUuid, serviceUserId),
    ).rejects.toBeInstanceOf(ForbiddenError)
    expect(tx.user_notification.deleteMany).not.toHaveBeenCalled()
  })

  it('does not delete an approved club', async () => {
    tx.club.findFirst.mockResolvedValueOnce({ status: 'APPROVED' })
    await expect(
      new ClubService().deleteManagedClub(clubUuid, serviceUserId),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(tx.user_notification.deleteMany).not.toHaveBeenCalled()
    expect(tx.club.updateMany).not.toHaveBeenCalled()
  })
})
