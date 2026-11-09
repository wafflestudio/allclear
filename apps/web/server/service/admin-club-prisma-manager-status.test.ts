import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prisma, tx } = vi.hoisted(() => {
  const tx = {
    $queryRaw: vi.fn(),
    club_manager: { findFirst: vi.fn(), create: vi.fn(), deleteMany: vi.fn() },
    club_manager_request: { update: vi.fn() },
    user_notification: { create: vi.fn(), deleteMany: vi.fn() },
  }
  return { prisma: { $transaction: vi.fn() }, tx }
})

vi.mock('../provider', () => ({
  InjectRepository: () => () => undefined,
  Service: () => undefined,
}))
vi.mock('../infra/database/prisma', () => ({ getPrismaClient: () => prisma }))

import { AdminClubService } from './admin-club.service'

const requestId = 123
const clubId = '123e4567-e89b-12d3-a456-426614174000'
const userId = '123e4567-e89b-12d3-a456-426614174001'
const request = {
  id: BigInt(requestId),
  club_id: clubId,
  service_user_id: userId,
  name: 'Applicant',
  phone: '01012345678',
  student_id: '12345678',
  status: 'PENDING',
}

beforeEach(() => {
  vi.resetAllMocks()
  prisma.$transaction.mockImplementation(async (callback) => callback(tx))
  tx.$queryRaw.mockResolvedValue([request])
  tx.club_manager.findFirst.mockResolvedValue(null)
})

describe('AdminClubService Prisma manager request status updates', () => {
  it('approves a pending request, creates the manager, and notifies the applicant', async () => {
    const result = await new AdminClubService().updateAdminClubManagerRequestStatus(requestId, {
      status: 'APPROVED',
    })

    expect(prisma.$transaction).toHaveBeenCalledOnce()
    const [sql, id] = tx.$queryRaw.mock.calls[0]
    expect(sql.join('')).toContain('FOR UPDATE')
    expect(id).toBe(BigInt(requestId))
    expect(tx.club_manager.findFirst).toHaveBeenCalledWith({
      where: { club_id: clubId, deleted_at: null },
      select: { id: true },
    })
    expect(tx.club_manager.create).toHaveBeenCalledWith({
      data: {
        club_id: clubId,
        service_user_id: userId,
        name: request.name,
        phone: request.phone,
        student_id: request.student_id,
      },
    })
    expect(tx.club_manager_request.update).toHaveBeenCalledWith({
      where: { id: BigInt(requestId) },
      data: { status: 'APPROVED', reject_reason: '' },
    })
    expect(tx.user_notification.create).toHaveBeenCalledWith({
      data: {
        service_user_id: userId,
        type: 'MANAGER_REQUEST_APPROVED',
        club_id: clubId,
        source_type: 'CLUB_MANAGER_REQUEST',
        source_id: String(requestId),
      },
    })
    expect(result).toEqual({
      request_id: requestId,
      club_uuid: clubId,
      status: 'APPROVED',
      processed_at: expect.any(String),
    })
  })

  it('rejects a request with a trimmed reason in the notification', async () => {
    await new AdminClubService().updateAdminClubManagerRequestStatus(requestId, {
      status: 'REJECTED',
      reject_reason: '  사유  ',
    })

    expect(tx.club_manager.create).not.toHaveBeenCalled()
    expect(tx.club_manager_request.update).toHaveBeenCalledWith({
      where: { id: BigInt(requestId) },
      data: { status: 'REJECTED', reject_reason: '사유' },
    })
    expect(tx.user_notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'MANAGER_REQUEST_REJECTED',
        metadata: { rejectReason: '사유' },
      }),
    })
  })

  it('removes an approved manager and result notifications when reset to pending', async () => {
    tx.$queryRaw.mockResolvedValueOnce([{ ...request, status: 'APPROVED' }])
    await new AdminClubService().updateAdminClubManagerRequestStatus(requestId, {
      status: 'PENDING',
    })

    expect(tx.club_manager.deleteMany).toHaveBeenCalledWith({
      where: { club_id: clubId, service_user_id: userId },
    })
    expect(tx.user_notification.deleteMany).toHaveBeenCalledWith({
      where: {
        source_type: 'CLUB_MANAGER_REQUEST',
        source_id: String(requestId),
        type: { in: ['MANAGER_REQUEST_APPROVED', 'MANAGER_REQUEST_REJECTED'] },
      },
    })
    expect(tx.user_notification.create).not.toHaveBeenCalled()
  })

  it('does not notify again when a rejected status is unchanged', async () => {
    tx.$queryRaw.mockResolvedValueOnce([{ ...request, status: 'REJECTED' }])
    await new AdminClubService().updateAdminClubManagerRequestStatus(requestId, {
      status: 'REJECTED',
      reject_reason: 'same',
    })
    expect(tx.club_manager_request.update).toHaveBeenCalledOnce()
    expect(tx.user_notification.create).not.toHaveBeenCalled()
  })

  it('rejects approval from a non-pending status', async () => {
    tx.$queryRaw.mockResolvedValueOnce([{ ...request, status: 'REJECTED' }])
    await expect(
      new AdminClubService().updateAdminClubManagerRequestStatus(requestId, {
        status: 'APPROVED',
      }),
    ).rejects.toThrow('can only approve from PENDING status')
    expect(tx.club_manager_request.update).not.toHaveBeenCalled()
  })

  it('rejects approval when an active manager exists', async () => {
    tx.club_manager.findFirst.mockResolvedValueOnce({ id: 1 })
    await expect(
      new AdminClubService().updateAdminClubManagerRequestStatus(requestId, {
        status: 'APPROVED',
      }),
    ).rejects.toThrow('club already has a manager')
    expect(tx.club_manager.create).not.toHaveBeenCalled()
    expect(tx.club_manager_request.update).not.toHaveBeenCalled()
  })

  it('does not write when the request is missing', async () => {
    tx.$queryRaw.mockResolvedValueOnce([])
    await expect(
      new AdminClubService().updateAdminClubManagerRequestStatus(requestId, {
        status: 'REJECTED',
        reject_reason: 'reason',
      }),
    ).rejects.toThrow('manager request not found')
    expect(tx.club_manager_request.update).not.toHaveBeenCalled()
  })
})
