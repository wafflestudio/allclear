import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prisma, tx } = vi.hoisted(() => {
  const tx = {
    $queryRaw: vi.fn(),
    club: { updateMany: vi.fn() },
    club_verification_request: { update: vi.fn() },
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
const request = { id: BigInt(requestId), club_id: clubId, status: 'PENDING' }

beforeEach(() => {
  vi.resetAllMocks()
  prisma.$transaction.mockImplementation(async (callback) => callback(tx))
  tx.$queryRaw.mockResolvedValue([request])
})

describe('AdminClubService Prisma verification request status updates', () => {
  it('approves a pending request and verifies the club in one transaction', async () => {
    const result = await new AdminClubService().updateAdminClubVerificationRequestStatus(
      requestId,
      { status: 'APPROVED' },
    )

    expect(prisma.$transaction).toHaveBeenCalledOnce()
    const [sql, id] = tx.$queryRaw.mock.calls[0]
    expect(sql.join('')).toContain('FOR UPDATE')
    expect(id).toBe(BigInt(requestId))
    const clubUpdate = tx.club.updateMany.mock.calls[0][0]
    expect(clubUpdate).toEqual({
      where: { uuid: clubId },
      data: {
        is_official_verified: true,
        verified_at: expect.any(Date),
        updated_at: expect.any(Date),
      },
    })
    expect(clubUpdate.data.verified_at).toBe(clubUpdate.data.updated_at)
    expect(tx.club_verification_request.update).toHaveBeenCalledWith({
      where: { id: BigInt(requestId) },
      data: { status: 'APPROVED', reject_reason: '' },
    })
    expect(result).toEqual({
      request_id: requestId,
      club_uuid: clubId,
      status: 'APPROVED',
      is_official_verified: true,
      processed_at: clubUpdate.data.updated_at.toISOString(),
    })
  })

  it('reverses club verification when an approved request returns to pending', async () => {
    tx.$queryRaw.mockResolvedValueOnce([{ ...request, status: 'APPROVED' }])
    const result = await new AdminClubService().updateAdminClubVerificationRequestStatus(
      requestId,
      { status: 'PENDING' },
    )

    expect(tx.club.updateMany).toHaveBeenCalledWith({
      where: { uuid: clubId },
      data: {
        is_official_verified: false,
        verified_at: null,
        updated_at: expect.any(Date),
      },
    })
    expect(tx.club_verification_request.update).toHaveBeenCalledWith({
      where: { id: BigInt(requestId) },
      data: { status: 'PENDING', reject_reason: '' },
    })
    expect(result.is_official_verified).toBe(false)
  })

  it('trims a rejection reason without changing the club verification', async () => {
    await new AdminClubService().updateAdminClubVerificationRequestStatus(requestId, {
      status: 'REJECTED',
      reject_reason: '  서류 부족  ',
    })

    expect(tx.club.updateMany).not.toHaveBeenCalled()
    expect(tx.club_verification_request.update).toHaveBeenCalledWith({
      where: { id: BigInt(requestId) },
      data: { status: 'REJECTED', reject_reason: '서류 부족' },
    })
  })

  it('rejects approval from a non-pending status', async () => {
    tx.$queryRaw.mockResolvedValueOnce([{ ...request, status: 'REJECTED' }])
    await expect(
      new AdminClubService().updateAdminClubVerificationRequestStatus(requestId, {
        status: 'APPROVED',
      }),
    ).rejects.toThrow('can only approve from PENDING status')
    expect(tx.club.updateMany).not.toHaveBeenCalled()
    expect(tx.club_verification_request.update).not.toHaveBeenCalled()
  })

  it('does not change the club when resetting a non-approved request', async () => {
    tx.$queryRaw.mockResolvedValueOnce([{ ...request, status: 'REJECTED' }])
    await new AdminClubService().updateAdminClubVerificationRequestStatus(requestId, {
      status: 'PENDING',
    })
    expect(tx.club.updateMany).not.toHaveBeenCalled()
    expect(tx.club_verification_request.update).toHaveBeenCalledOnce()
  })

  it('does not write when the request is missing', async () => {
    tx.$queryRaw.mockResolvedValueOnce([])
    await expect(
      new AdminClubService().updateAdminClubVerificationRequestStatus(requestId, {
        status: 'REJECTED',
      }),
    ).rejects.toThrow('verification request not found')
    expect(tx.club.updateMany).not.toHaveBeenCalled()
    expect(tx.club_verification_request.update).not.toHaveBeenCalled()
  })
})
