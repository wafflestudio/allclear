import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prisma, tx } = vi.hoisted(() => {
  const tx = {
    $queryRaw: vi.fn(),
    club_verification_request: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  }
  return {
    tx,
    prisma: {
      club_manager: { findFirst: vi.fn() },
      $transaction: vi.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
    },
  }
})

vi.mock('../provider', () => ({ Service: () => undefined }))
vi.mock('../infra/database/prisma', () => ({ getPrismaClient: () => prisma }))
vi.mock('server/domain/constants/official-verification-term', () => ({
  getOfficialVerificationTermKey: () => '261001',
}))

import { ConflictError, ForbiddenError, NotFoundError } from '../domain/error'
import { ClubVerificationService } from './club-verification.service'

const makeRequest = (overrides: Record<string, unknown> = {}) => ({
  id: BigInt(7),
  club_id: 'club-1',
  term_key: '261001',
  attempt_no: 1,
  status: 'REJECTED',
  reject_reason: 'reason',
  created_at: new Date('2026-10-01T00:00:00.000Z'),
  ...overrides,
})

beforeEach(() => {
  vi.clearAllMocks()
  prisma.club_manager.findFirst.mockResolvedValue({ id: 1 })
  tx.$queryRaw.mockResolvedValue([{ uuid: 'club-1', is_official_verified: false }])
  tx.club_verification_request.findUnique.mockResolvedValue(null)
  tx.club_verification_request.create.mockResolvedValue(makeRequest({ status: 'PENDING' }))
  tx.club_verification_request.update.mockResolvedValue(makeRequest({ status: 'PENDING' }))
})

describe('ClubVerificationService with Prisma', () => {
  it('checks an active manager and locks the club before creating a request', async () => {
    const result = await new ClubVerificationService().requestVerification('club-1', 'user-1')
    expect(prisma.club_manager.findFirst).toHaveBeenCalledWith({
      where: { club_id: 'club-1', service_user_id: 'user-1', deleted_at: null },
      select: { id: true },
    })
    const [sql, clubUuid] = tx.$queryRaw.mock.calls[0]
    expect(sql.join('')).toContain('FOR UPDATE')
    expect(clubUuid).toBe('club-1')
    expect(tx.club_verification_request.create).toHaveBeenCalledWith({
      data: { club_id: 'club-1', term_key: '261001', attempt_no: 1 },
    })
    expect(result).toEqual({
      id: '7',
      clubId: 'club-1',
      createdAt: '2026-10-01T00:00:00.000Z',
      attemptNo: 1,
    })
  })

  it('rejects a missing manager before opening a transaction', async () => {
    prisma.club_manager.findFirst.mockResolvedValue(null)
    await expect(
      new ClubVerificationService().requestVerification('club-1', 'user-1'),
    ).rejects.toBeInstanceOf(ForbiddenError)
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('rejects a deleted or verified club', async () => {
    tx.$queryRaw.mockResolvedValueOnce([])
    await expect(
      new ClubVerificationService().requestVerification('club-1', 'user-1'),
    ).rejects.toBeInstanceOf(NotFoundError)
    tx.$queryRaw.mockResolvedValueOnce([{ uuid: 'club-1', is_official_verified: true }])
    await expect(
      new ClubVerificationService().requestVerification('club-1', 'user-1'),
    ).rejects.toBeInstanceOf(ConflictError)
  })

  it('rejects a pending request and the retry limit', async () => {
    tx.club_verification_request.findUnique.mockResolvedValueOnce(
      makeRequest({ status: 'PENDING' }),
    )
    await expect(
      new ClubVerificationService().requestVerification('club-1', 'user-1'),
    ).rejects.toBeInstanceOf(ConflictError)
    tx.club_verification_request.findUnique.mockResolvedValueOnce(makeRequest({ attempt_no: 4 }))
    await expect(
      new ClubVerificationService().requestVerification('club-1', 'user-1'),
    ).rejects.toBeInstanceOf(ConflictError)
  })

  it('resets the attempt number when the verification term changes', async () => {
    tx.club_verification_request.findUnique.mockResolvedValue(makeRequest({ term_key: '260901' }))
    await new ClubVerificationService().requestVerification('club-1', 'user-1')
    expect(tx.club_verification_request.update).toHaveBeenCalledWith({
      where: { id: BigInt(7) },
      data: {
        term_key: '261001',
        attempt_no: 2,
        status: 'PENDING',
        reject_reason: null,
        created_at: expect.any(Date),
      },
    })
  })
})
