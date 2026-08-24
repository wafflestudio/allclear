import { createHash } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../provider', () => ({
  InjectRepository: () => () => undefined,
  Service: () => undefined,
}))

import { ConflictError, ForbiddenError, NotFoundError } from '../domain/error'
import {
  ClubEntity,
  ClubManagerEntity,
  ClubManagerTransferInvitationEntity,
  UserNotificationEntity,
} from '../infra/database/entities'
import {
  ClubManagerTransferService,
  hashManagerTransferToken,
} from './club-manager-transfer.service'

const clubUuid = '4dfcd19f-9f20-4128-8b4c-b76deab4b65d'
const senderServiceUserId = 'beee3485-6f87-4db0-b69f-c300f7c47291'
const recipientServiceUserId = 'f293f05e-7a0f-4da5-b028-aa8ba84c26a2'
const rawToken = 'a'.repeat(43)

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

const createTestContext = () => {
  const invitationRepository = {
    create: vi.fn((value) => value),
    findOne: vi.fn(),
    findOneBy: vi.fn(),
    insert: vi.fn(),
    save: vi.fn(async (value) => ({ id: '10', ...value })),
    update: vi.fn(),
  }
  const clubManagerRepository = {
    findOne: vi.fn(),
    insert: vi.fn(),
    softDelete: vi.fn(),
  }
  const clubRepository = {
    findOneBy: vi.fn(),
  }
  const notificationRepository = {
    insert: vi.fn(),
  }
  const transactionManager = {
    getRepository: vi.fn((entity) => {
      if (entity === ClubManagerTransferInvitationEntity) return invitationRepository
      if (entity === ClubManagerEntity) return clubManagerRepository
      if (entity === ClubEntity) return clubRepository
      if (entity === UserNotificationEntity) return notificationRepository
      throw new Error(`unexpected repository: ${entity.name}`)
    }),
  }
  const transaction = vi.fn(async (callback) => callback(transactionManager))
  const service = Object.create(ClubManagerTransferService.prototype) as ClubManagerTransferService
  Object.defineProperty(service, 'invitationRepository', {
    value: { manager: { transaction }, findOneBy: invitationRepository.findOneBy },
  })
  Object.defineProperty(service, 'clubRepository', {
    value: clubRepository,
  })

  return {
    service,
    invitationRepository,
    clubManagerRepository,
    clubRepository,
    notificationRepository,
  }
}

describe('ClubManagerTransferService', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-24T00:00:00.000Z'))
  })

  it('hashes transfer tokens without retaining the raw token', () => {
    expect(hashManagerTransferToken(rawToken)).toBe(
      createHash('sha256').update(rawToken).digest('hex'),
    )
    expect(hashManagerTransferToken(rawToken)).not.toContain(rawToken)
  })

  it('creates a 72-hour invitation and revokes the previous active invitation', async () => {
    const { service, invitationRepository, clubManagerRepository } = createTestContext()
    clubManagerRepository.findOne.mockResolvedValue({ id: 7 })

    const result = await service.createInvitation(clubUuid, senderServiceUserId)

    expect(invitationRepository.update).toHaveBeenCalledWith(
      {
        clubId: clubUuid,
        revokedAt: expect.anything(),
        acceptedAt: expect.anything(),
      },
      { revokedAt: '2026-08-24T00:00:00.000Z' },
    )
    expect(invitationRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        clubId: clubUuid,
        senderServiceUserId,
        tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        expiresAt: '2026-08-27T00:00:00.000Z',
      }),
    )
    expect(result.transfer_url).toMatch(/\/manager-transfer\/[A-Za-z0-9_-]{43}$/)
    expect(result.expires_at).toBe('2026-08-27T00:00:00.000Z')
    expect(invitationRepository.save.mock.calls[0][0].tokenHash).not.toBe(
      result.transfer_url.split('/').at(-1),
    )
  })

  it('rejects invitation creation by a non-manager', async () => {
    const { service, invitationRepository, clubManagerRepository } = createTestContext()
    clubManagerRepository.findOne.mockResolvedValue(null)

    await expect(service.createInvitation(clubUuid, senderServiceUserId)).rejects.toBeInstanceOf(
      ForbiddenError,
    )
    expect(invitationRepository.save).not.toHaveBeenCalled()
  })

  it('returns only an active invitation summary', async () => {
    const { service, invitationRepository, clubRepository } = createTestContext()
    invitationRepository.findOneBy.mockResolvedValue({
      clubId: clubUuid,
      expiresAt: '2026-08-27T00:00:00.000Z',
      revokedAt: null,
      acceptedAt: null,
    })
    clubRepository.findOneBy.mockResolvedValue({ uuid: clubUuid, name: '와플스튜디오' })

    await expect(service.getInvitation(rawToken)).resolves.toEqual({
      club_uuid: clubUuid,
      club_name: '와플스튜디오',
      expires_at: '2026-08-27T00:00:00.000Z',
    })
  })

  it.each([
    { expiresAt: '2026-08-23T23:59:59.000Z', revokedAt: null, acceptedAt: null },
    {
      expiresAt: '2026-08-27T00:00:00.000Z',
      revokedAt: '2026-08-24T00:00:00.000Z',
      acceptedAt: null,
    },
    {
      expiresAt: '2026-08-27T00:00:00.000Z',
      revokedAt: null,
      acceptedAt: '2026-08-24T00:00:00.000Z',
    },
  ])('hides expired, revoked, and accepted invitations', async (state) => {
    const { service, invitationRepository, clubRepository } = createTestContext()
    invitationRepository.findOneBy.mockResolvedValue({ clubId: clubUuid, ...state })

    await expect(service.getInvitation(rawToken)).rejects.toBeInstanceOf(NotFoundError)
    expect(clubRepository.findOneBy).not.toHaveBeenCalled()
  })

  it('atomically replaces the manager and notifies the sender', async () => {
    const {
      service,
      invitationRepository,
      clubManagerRepository,
      clubRepository,
      notificationRepository,
    } = createTestContext()
    invitationRepository.findOne.mockResolvedValue({
      id: '10',
      clubId: clubUuid,
      senderServiceUserId,
      expiresAt: '2026-08-27T00:00:00.000Z',
      revokedAt: null,
      acceptedByServiceUserId: null,
      acceptedAt: null,
    })
    clubManagerRepository.findOne.mockResolvedValue({ id: 7 })
    clubRepository.findOneBy.mockResolvedValue({ uuid: clubUuid, name: '와플스튜디오' })

    await expect(service.acceptInvitation(rawToken, recipient)).resolves.toEqual({
      club_uuid: clubUuid,
      club_name: '와플스튜디오',
    })

    expect(invitationRepository.findOne).toHaveBeenCalledWith({
      where: { tokenHash: hashManagerTransferToken(rawToken) },
      lock: { mode: 'pessimistic_write' },
    })
    expect(clubManagerRepository.softDelete).toHaveBeenCalledWith({ id: 7 })
    expect(clubManagerRepository.insert).toHaveBeenCalledWith({
      clubId: clubUuid,
      serviceUserId: recipientServiceUserId,
      name: '이수민',
      phone: '010-1234-5678',
      studentId: '23학번',
    })
    expect(invitationRepository.update).toHaveBeenCalledWith(
      { id: '10' },
      {
        acceptedByServiceUserId: recipientServiceUserId,
        acceptedAt: '2026-08-24T00:00:00.000Z',
      },
    )
    expect(notificationRepository.insert).toHaveBeenCalledWith({
      serviceUserId: senderServiceUserId,
      type: 'MANAGER_TRANSFER_COMPLETED',
      clubId: clubUuid,
      sourceType: 'MANAGER_TRANSFER',
      sourceId: '10',
      metadata: null,
    })
  })

  it('rejects a self-transfer before mutating manager state', async () => {
    const { service, invitationRepository, clubManagerRepository } = createTestContext()
    invitationRepository.findOne.mockResolvedValue({
      id: '10',
      clubId: clubUuid,
      senderServiceUserId: recipientServiceUserId,
      expiresAt: '2026-08-27T00:00:00.000Z',
      revokedAt: null,
      acceptedByServiceUserId: null,
      acceptedAt: null,
    })

    await expect(service.acceptInvitation(rawToken, recipient)).rejects.toBeInstanceOf(
      ConflictError,
    )
    expect(clubManagerRepository.softDelete).not.toHaveBeenCalled()
    expect(clubManagerRepository.insert).not.toHaveBeenCalled()
  })

  it('treats a repeated acceptance by the same recipient as idempotent', async () => {
    const { service, invitationRepository, clubManagerRepository, clubRepository } =
      createTestContext()
    invitationRepository.findOne.mockResolvedValue({
      id: '10',
      clubId: clubUuid,
      senderServiceUserId,
      expiresAt: '2026-08-27T00:00:00.000Z',
      revokedAt: null,
      acceptedByServiceUserId: recipientServiceUserId,
      acceptedAt: '2026-08-24T00:00:00.000Z',
    })
    clubRepository.findOneBy.mockResolvedValue({ uuid: clubUuid, name: '와플스튜디오' })

    await expect(service.acceptInvitation(rawToken, recipient)).resolves.toEqual({
      club_uuid: clubUuid,
      club_name: '와플스튜디오',
    })
    expect(clubManagerRepository.softDelete).not.toHaveBeenCalled()
    expect(clubManagerRepository.insert).not.toHaveBeenCalled()
  })

  it('hides an accepted invitation from a different recipient', async () => {
    const { service, invitationRepository } = createTestContext()
    invitationRepository.findOne.mockResolvedValue({
      id: '10',
      clubId: clubUuid,
      senderServiceUserId,
      expiresAt: '2026-08-27T00:00:00.000Z',
      revokedAt: null,
      acceptedByServiceUserId: '04cc77e4-b65d-4df5-b4d6-3a52bdd49974',
      acceptedAt: '2026-08-24T00:00:00.000Z',
    })

    await expect(service.acceptInvitation(rawToken, recipient)).rejects.toBeInstanceOf(
      NotFoundError,
    )
  })
})
