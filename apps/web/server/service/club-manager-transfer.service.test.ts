import { createHash } from 'node:crypto'
import { QueryFailedError } from 'typeorm'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prisma, tx } = vi.hoisted(() => {
  const tx = {
    $queryRaw: vi.fn(),
    club_manager: { update: vi.fn(), create: vi.fn() },
    club_manager_transfer_invitation: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    club: { findFirst: vi.fn() },
    user_notification: { create: vi.fn() },
  }
  return {
    tx,
    prisma: {
      $transaction: vi.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
      club_manager_transfer_invitation: { findUnique: vi.fn() },
      club: { findFirst: vi.fn() },
    },
  }
})

vi.mock('../provider', () => ({ Service: () => undefined }))
vi.mock('../infra/database/prisma', () => ({ getPrismaClient: () => prisma }))

import { ConflictError, ForbiddenError, NotFoundError } from '../domain/error'
import { Prisma } from '../infra/database/generated/prisma/client'
import {
  ClubManagerTransferService,
  hashManagerTransferToken,
} from './club-manager-transfer.service'

const clubUuid = '4dfcd19f-9f20-4128-8b4c-b76deab4b65d'
const senderServiceUserId = 'beee3485-6f87-4db0-b69f-c300f7c47291'
const recipientServiceUserId = 'f293f05e-7a0f-4da5-b028-aa8ba84c26a2'
const rawToken = 'a'.repeat(43)
const now = new Date('2026-08-24T00:00:00.000Z')
const expiresAt = new Date('2026-08-27T00:00:00.000Z')

const recipient = {
  id: 'e2b70f48-f52d-492a-a63e-ff38ac2df81c',
  serviceUserId: recipientServiceUserId,
  nickname: '새 관리자',
  name: '이수민',
  phone: '010-1234-5678',
  email: 'recipient@example.com',
  collegeMajor: null,
  admissionClass: 23,
}

const invitation = (changes: Record<string, unknown> = {}) => ({
  id: BigInt(10),
  club_id: clubUuid,
  sender_service_user_id: senderServiceUserId,
  token_hash: hashManagerTransferToken(rawToken),
  expires_at: expiresAt,
  revoked_at: null,
  accepted_by_service_user_id: null,
  accepted_at: null,
  created_at: now,
  ...changes,
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(now)
  tx.$queryRaw.mockResolvedValue([{ id: 7 }])
  tx.club_manager_transfer_invitation.findUnique.mockResolvedValue(invitation())
  tx.club.findFirst.mockResolvedValue({ uuid: clubUuid, name: '와플스튜디오' })
  prisma.club.findFirst.mockResolvedValue({ uuid: clubUuid, name: '와플스튜디오' })
  prisma.club_manager_transfer_invitation.findUnique.mockResolvedValue(invitation())
})

describe('ClubManagerTransferService with Prisma', () => {
  it('hashes transfer tokens without retaining the raw token', () => {
    expect(hashManagerTransferToken(rawToken)).toBe(
      createHash('sha256').update(rawToken).digest('hex'),
    )
    expect(hashManagerTransferToken(rawToken)).not.toContain(rawToken)
  })

  it('creates a 72-hour invitation after locking the sender manager', async () => {
    const result = await new ClubManagerTransferService().createInvitation(
      clubUuid,
      senderServiceUserId,
    )
    expect(tx.$queryRaw).toHaveBeenCalledTimes(1)
    const [sql, lockedClubUuid, lockedSenderId] = tx.$queryRaw.mock.calls[0]
    expect(sql.join('')).toContain('FROM club_manager')
    expect(sql.join('')).toContain('FOR UPDATE')
    expect([lockedClubUuid, lockedSenderId]).toEqual([clubUuid, senderServiceUserId])
    expect(tx.club_manager_transfer_invitation.updateMany).toHaveBeenCalledWith({
      where: { club_id: clubUuid, revoked_at: null, accepted_at: null },
      data: { revoked_at: now },
    })
    expect(tx.club_manager_transfer_invitation.create).toHaveBeenCalledWith({
      data: {
        club_id: clubUuid,
        sender_service_user_id: senderServiceUserId,
        token_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
        expires_at: expiresAt,
      },
    })
    expect(result.transfer_url).toMatch(/\/manager-transfer\/[A-Za-z0-9_-]{43}$/)
    expect(result.expires_at).toBe('2026-08-27T00:00:00.000Z')
    expect(tx.club_manager_transfer_invitation.create.mock.calls[0][0].data.token_hash).not.toBe(
      result.transfer_url.split('/').at(-1),
    )
  })

  it('rejects invitation creation by a non-manager', async () => {
    tx.$queryRaw.mockResolvedValueOnce([])
    await expect(
      new ClubManagerTransferService().createInvitation(clubUuid, senderServiceUserId),
    ).rejects.toBeInstanceOf(ForbiddenError)
    expect(tx.club_manager_transfer_invitation.create).not.toHaveBeenCalled()
  })

  it('returns only an active invitation summary', async () => {
    await expect(new ClubManagerTransferService().getInvitation(rawToken)).resolves.toEqual({
      club_uuid: clubUuid,
      club_name: '와플스튜디오',
      expires_at: '2026-08-27T00:00:00.000Z',
    })
    expect(prisma.club.findFirst).toHaveBeenCalledWith({
      where: { uuid: clubUuid, deleted_at: null },
      select: { uuid: true, name: true },
    })
  })

  it.each([
    { expires_at: new Date('2026-08-23T23:59:59.000Z') },
    { revoked_at: now },
    { accepted_at: now },
  ])('hides expired, revoked, and accepted invitations', async (state) => {
    prisma.club_manager_transfer_invitation.findUnique.mockResolvedValue(invitation(state))
    await expect(new ClubManagerTransferService().getInvitation(rawToken)).rejects.toBeInstanceOf(
      NotFoundError,
    )
    expect(prisma.club.findFirst).not.toHaveBeenCalled()
  })

  it('atomically replaces the manager and notifies the sender', async () => {
    tx.$queryRaw.mockResolvedValueOnce([{ id: 7 }]).mockResolvedValueOnce([{ id: BigInt(10) }])
    const result = await new ClubManagerTransferService().acceptInvitation(rawToken, recipient)
    expect(result).toEqual({ club_uuid: clubUuid, club_name: '와플스튜디오' })
    expect(tx.$queryRaw).toHaveBeenCalledTimes(2)
    expect(tx.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(
      tx.$queryRaw.mock.invocationCallOrder[1],
    )
    expect(tx.$queryRaw.mock.calls[1][0].join('')).toContain(
      'FROM club_manager_transfer_invitation',
    )
    expect(tx.club_manager.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { deleted_at: now, updated_at: now },
    })
    expect(tx.club_manager.create).toHaveBeenCalledWith({
      data: {
        club_id: clubUuid,
        service_user_id: recipientServiceUserId,
        name: '이수민',
        phone: '010-1234-5678',
        student_id: '23학번',
      },
    })
    expect(tx.club_manager_transfer_invitation.update).toHaveBeenCalledWith({
      where: { id: BigInt(10) },
      data: { accepted_by_service_user_id: recipientServiceUserId, accepted_at: now },
    })
    expect(tx.user_notification.create).toHaveBeenCalledWith({
      data: {
        service_user_id: senderServiceUserId,
        type: 'MANAGER_TRANSFER_COMPLETED',
        club_id: clubUuid,
        source_type: 'MANAGER_TRANSFER',
        source_id: '10',
        metadata: { clubName: '와플스튜디오' },
      },
    })
  })

  it.each(['uq_club_manager_active_club', 'club_manager_clubid_serviceuserid'])(
    'maps %s uniqueness conflicts to a safe domain error',
    async (constraint) => {
      prisma.$transaction.mockRejectedValueOnce(
        new QueryFailedError(
          'INSERT INTO club_manager ...',
          [],
          Object.assign(new Error('unique violation'), { code: '23505', constraint }),
        ),
      )
      await expect(
        new ClubManagerTransferService().acceptInvitation(rawToken, recipient),
      ).rejects.toBeInstanceOf(ConflictError)
    },
  )

  it('maps a Prisma unique conflict on the active manager index', async () => {
    prisma.$transaction.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '7.10.0',
        meta: { target: 'uq_club_manager_active_club' },
      }),
    )
    await expect(
      new ClubManagerTransferService().acceptInvitation(rawToken, recipient),
    ).rejects.toBeInstanceOf(ConflictError)
  })

  it('maps a Prisma field target for the manager uniqueness conflict', async () => {
    prisma.$transaction.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '7.10.0',
        meta: { target: ['club_id', 'service_user_id'] },
      }),
    )
    await expect(
      new ClubManagerTransferService().acceptInvitation(rawToken, recipient),
    ).rejects.toBeInstanceOf(ConflictError)
  })

  it('preserves unexpected database failures', async () => {
    const failure = new Error('database unavailable')
    prisma.$transaction.mockRejectedValueOnce(failure)
    await expect(
      new ClubManagerTransferService().acceptInvitation(rawToken, recipient),
    ).rejects.toBe(failure)
  })

  it('rejects a self-transfer before changing the manager', async () => {
    tx.club_manager_transfer_invitation.findUnique.mockResolvedValue(
      invitation({ sender_service_user_id: recipientServiceUserId }),
    )
    await expect(
      new ClubManagerTransferService().acceptInvitation(rawToken, recipient),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(tx.$queryRaw).not.toHaveBeenCalled()
    expect(tx.club_manager.update).not.toHaveBeenCalled()
  })

  it('treats a repeated acceptance by the same recipient as idempotent', async () => {
    tx.club_manager_transfer_invitation.findUnique.mockResolvedValue(
      invitation({ accepted_at: now, accepted_by_service_user_id: recipientServiceUserId }),
    )
    await expect(
      new ClubManagerTransferService().acceptInvitation(rawToken, recipient),
    ).resolves.toEqual({
      club_uuid: clubUuid,
      club_name: '와플스튜디오',
    })
    expect(tx.$queryRaw).not.toHaveBeenCalled()
    expect(tx.club_manager.create).not.toHaveBeenCalled()
  })

  it('handles a concurrent repeat after the old manager row disappears', async () => {
    tx.$queryRaw.mockResolvedValueOnce([])
    tx.club_manager_transfer_invitation.findUnique
      .mockResolvedValueOnce(invitation())
      .mockResolvedValueOnce(
        invitation({ accepted_at: now, accepted_by_service_user_id: recipientServiceUserId }),
      )
    await expect(
      new ClubManagerTransferService().acceptInvitation(rawToken, recipient),
    ).resolves.toEqual({
      club_uuid: clubUuid,
      club_name: '와플스튜디오',
    })
    expect(tx.club_manager.create).not.toHaveBeenCalled()
  })

  it('hides a concurrent acceptance by a different recipient', async () => {
    tx.$queryRaw.mockResolvedValueOnce([])
    tx.club_manager_transfer_invitation.findUnique
      .mockResolvedValueOnce(invitation())
      .mockResolvedValueOnce(
        invitation({ accepted_at: now, accepted_by_service_user_id: 'another-user' }),
      )
    await expect(
      new ClubManagerTransferService().acceptInvitation(rawToken, recipient),
    ).rejects.toBeInstanceOf(NotFoundError)
    expect(tx.club_manager.create).not.toHaveBeenCalled()
  })

  it('hides a concurrent acceptance after locking the invitation', async () => {
    tx.$queryRaw.mockResolvedValueOnce([{ id: 7 }]).mockResolvedValueOnce([{ id: BigInt(10) }])
    tx.club_manager_transfer_invitation.findUnique
      .mockResolvedValueOnce(invitation())
      .mockResolvedValueOnce(
        invitation({ accepted_at: now, accepted_by_service_user_id: 'another-user' }),
      )
    await expect(
      new ClubManagerTransferService().acceptInvitation(rawToken, recipient),
    ).rejects.toBeInstanceOf(NotFoundError)
    expect(tx.club_manager.create).not.toHaveBeenCalled()
  })
})
