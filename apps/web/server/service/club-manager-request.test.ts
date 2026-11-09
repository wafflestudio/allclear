import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prisma, tx } = vi.hoisted(() => {
  const tx = {
    $queryRaw: vi.fn(),
    club_manager: { findFirst: vi.fn() },
    club_manager_request: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    user_notification: { deleteMany: vi.fn() },
  }
  return {
    prisma: {
      $transaction: vi.fn(),
      club_manager_request: { findFirst: vi.fn() },
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

import { ConflictError, NotFoundError } from '../domain/error'
import { ClubService } from './club.service'

const clubUuid = '4dfcd19f-9f20-4128-8b4c-b76deab4b65d'
const serviceUserId = 'beee3485-6f87-4db0-b69f-c300f7c47291'
const requestData = {
  name: '홍길동',
  phone: '010-1234-5678',
  student_id: '2021-12345',
}

function createService() {
  const service = new ClubService()
  const getExistingClub = vi.fn().mockResolvedValue({ uuid: clubUuid })
  Object.defineProperty(service, 'clubAccessService', { value: { getExistingClub } })
  return { service, getExistingClub }
}

beforeEach(() => {
  vi.resetAllMocks()
  prisma.$transaction.mockImplementation(async (callback) => callback(tx))
  prisma.club_manager_request.findFirst.mockResolvedValue(null)
  tx.club_manager.findFirst.mockResolvedValue(null)
  tx.club_manager_request.findFirst.mockResolvedValue(null)
  tx.club_manager_request.findMany.mockResolvedValue([])
  tx.$queryRaw.mockResolvedValue([])
})

describe('ClubService Prisma manager requests', () => {
  it('returns the latest pending request before looking for a rejected request', async () => {
    prisma.club_manager_request.findFirst.mockResolvedValueOnce(requestData)
    const { service } = createService()

    await expect(service.getClubManagerRequest(clubUuid, serviceUserId)).resolves.toEqual(
      requestData,
    )
    expect(prisma.club_manager_request.findFirst).toHaveBeenCalledOnce()
    expect(prisma.club_manager_request.findFirst).toHaveBeenCalledWith({
      where: { club_id: clubUuid, service_user_id: serviceUserId, status: 'PENDING' },
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      select: { name: true, phone: true, student_id: true },
    })
  })

  it('falls back to the latest rejected request and hides other statuses', async () => {
    prisma.club_manager_request.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(requestData)
    const { service } = createService()

    await expect(service.getClubManagerRequest(clubUuid, serviceUserId)).resolves.toEqual(
      requestData,
    )
    expect(prisma.club_manager_request.findFirst).toHaveBeenNthCalledWith(2, {
      where: { club_id: clubUuid, service_user_id: serviceUserId, status: 'REJECTED' },
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      select: { name: true, phone: true, student_id: true },
    })

    prisma.club_manager_request.findFirst.mockResolvedValue(null)
    await expect(service.getClubManagerRequest(clubUuid, serviceUserId)).rejects.toBeInstanceOf(
      NotFoundError,
    )
  })

  it('creates a new request when the club has no manager or pending request', async () => {
    const { service, getExistingClub } = createService()
    await service.createClubManagerRequest(clubUuid, serviceUserId, requestData)

    expect(getExistingClub).toHaveBeenCalledWith(clubUuid)
    expect(tx.club_manager.findFirst).toHaveBeenCalledWith({
      where: { club_id: clubUuid, deleted_at: null },
      select: { id: true },
    })
    expect(tx.club_manager_request.create).toHaveBeenCalledWith({
      data: { club_id: clubUuid, service_user_id: serviceUserId, ...requestData },
    })
  })

  it('resubmits the latest rejected request and removes its notification', async () => {
    tx.club_manager_request.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: BigInt(42) })
    const { service } = createService()
    await service.createClubManagerRequest(clubUuid, serviceUserId, requestData)

    expect(tx.club_manager_request.update).toHaveBeenCalledWith({
      where: { id: BigInt(42) },
      data: {
        ...requestData,
        status: 'PENDING',
        reject_reason: '',
        created_at: expect.any(Date),
      },
    })
    expect(tx.user_notification.deleteMany).toHaveBeenCalledWith({
      where: {
        source_type: 'CLUB_MANAGER_REQUEST',
        source_id: '42',
        type: 'MANAGER_REQUEST_REJECTED',
      },
    })
    expect(tx.club_manager_request.create).not.toHaveBeenCalled()
  })

  it('rejects a request when the club has a manager or the user has a pending request', async () => {
    tx.club_manager.findFirst.mockResolvedValueOnce({ id: 1 })
    const { service } = createService()
    await expect(
      service.createClubManagerRequest(clubUuid, serviceUserId, requestData),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(tx.club_manager_request.create).not.toHaveBeenCalled()

    tx.club_manager_request.findFirst.mockResolvedValueOnce({ id: BigInt(4) })
    await expect(
      service.createClubManagerRequest(clubUuid, serviceUserId, requestData),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(tx.club_manager_request.create).not.toHaveBeenCalled()
  })

  it('locks and updates the latest pending request without changing its status', async () => {
    tx.$queryRaw.mockResolvedValueOnce([{ id: BigInt(1) }])
    const { service } = createService()
    await service.updateClubManagerRequest(clubUuid, serviceUserId, {
      phone: '010-9876-5432',
    })

    const [sql, uuid, userId, status] = tx.$queryRaw.mock.calls[0]
    expect(sql.join('')).toContain('LIMIT 1 FOR UPDATE')
    expect([uuid, userId, status]).toEqual([clubUuid, serviceUserId, 'PENDING'])
    expect(tx.club_manager_request.update).toHaveBeenCalledWith({
      where: { id: BigInt(1) },
      data: { phone: '010-9876-5432' },
    })
    expect(tx.user_notification.deleteMany).not.toHaveBeenCalled()
  })

  it('resubmits a rejected request only when explicitly requested', async () => {
    tx.$queryRaw.mockResolvedValueOnce([{ id: BigInt(2) }])
    const { service } = createService()
    await service.updateClubManagerRequest(clubUuid, serviceUserId, {
      name: '홍길동',
      resubmit: true,
    })

    expect(tx.$queryRaw.mock.calls[0][3]).toBe('REJECTED')
    expect(tx.club_manager_request.update).toHaveBeenCalledWith({
      where: { id: BigInt(2) },
      data: {
        name: '홍길동',
        status: 'PENDING',
        reject_reason: '',
        created_at: expect.any(Date),
      },
    })
    expect(tx.user_notification.deleteMany).toHaveBeenCalledWith({
      where: {
        source_type: 'CLUB_MANAGER_REQUEST',
        source_id: '2',
        type: 'MANAGER_REQUEST_REJECTED',
      },
    })
  })

  it('does not edit an absent pending or rejected request', async () => {
    const { service } = createService()
    await expect(
      service.updateClubManagerRequest(clubUuid, serviceUserId, { phone: '010-9876-5432' }),
    ).rejects.toBeInstanceOf(NotFoundError)
    await expect(
      service.updateClubManagerRequest(clubUuid, serviceUserId, { resubmit: true }),
    ).rejects.toBeInstanceOf(NotFoundError)
    expect(tx.club_manager_request.update).not.toHaveBeenCalled()
  })

  it('deletes all cancellable requests and their rejection notifications', async () => {
    tx.club_manager_request.findMany.mockResolvedValueOnce([{ id: BigInt(3) }, { id: BigInt(4) }])
    const { service } = createService()
    await service.deleteClubManagerRequest(clubUuid, serviceUserId)

    expect(tx.club_manager_request.findMany).toHaveBeenCalledWith({
      where: {
        club_id: clubUuid,
        service_user_id: serviceUserId,
        status: { in: ['PENDING', 'REJECTED'] },
      },
      select: { id: true },
    })
    expect(tx.user_notification.deleteMany).toHaveBeenCalledWith({
      where: {
        source_type: 'CLUB_MANAGER_REQUEST',
        source_id: { in: ['3', '4'] },
        type: 'MANAGER_REQUEST_REJECTED',
      },
    })
    expect(tx.club_manager_request.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: [BigInt(3), BigInt(4)] } },
    })
  })

  it('does not delete anything when no cancellable request exists', async () => {
    const { service } = createService()
    await expect(service.deleteClubManagerRequest(clubUuid, serviceUserId)).rejects.toBeInstanceOf(
      NotFoundError,
    )
    expect(tx.user_notification.deleteMany).not.toHaveBeenCalled()
    expect(tx.club_manager_request.deleteMany).not.toHaveBeenCalled()
  })
})
