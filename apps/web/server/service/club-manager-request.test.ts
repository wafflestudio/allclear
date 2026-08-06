import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../provider', () => ({
  Inject: () => () => undefined,
  InjectRepository: () => () => undefined,
  Service: () => undefined,
}))

import { NotFoundError } from '../domain/error'
import { UserNotificationEntity } from '../infra/database/entities'
import { ClubManagerRegisterRequestEntity } from '../infra/database/entities/club-manager-register-request.entity'
import { ClubService } from './club.service'

const clubUuid = '4dfcd19f-9f20-4128-8b4c-b76deab4b65d'
const serviceUserId = 'beee3485-6f87-4db0-b69f-c300f7c47291'

describe('ClubService.getClubManagerRequest', () => {
  let service: ClubService
  let findOne: ReturnType<typeof vi.fn>

  beforeEach(() => {
    service = new ClubService()
    findOne = vi.fn()
    Object.assign(service, {
      clubManagerRegisterRequestRepository: { findOne },
    })
  })

  it('returns the latest pending request without querying rejected requests', async () => {
    findOne.mockResolvedValueOnce({
      name: '홍길동',
      phone: '010-1234-5678',
      studentId: '2021-12345',
    })

    await expect(service.getClubManagerRequest(clubUuid, serviceUserId)).resolves.toEqual({
      name: '홍길동',
      phone: '010-1234-5678',
      student_id: '2021-12345',
    })
    expect(findOne).toHaveBeenCalledTimes(1)
    expect(findOne).toHaveBeenCalledWith({
      where: {
        clubId: clubUuid,
        serviceUserId,
        status: 'PENDING',
      },
      order: {
        createdAt: 'DESC',
        id: 'DESC',
      },
    })
  })

  it('falls back to the latest rejected request using both ownership conditions', async () => {
    findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({
      name: '김와플',
      phone: '010-9876-5432',
      studentId: '2022-54321',
    })

    await expect(service.getClubManagerRequest(clubUuid, serviceUserId)).resolves.toEqual({
      name: '김와플',
      phone: '010-9876-5432',
      student_id: '2022-54321',
    })
    expect(findOne).toHaveBeenNthCalledWith(2, {
      where: {
        clubId: clubUuid,
        serviceUserId,
        status: 'REJECTED',
      },
      order: {
        createdAt: 'DESC',
        id: 'DESC',
      },
    })
  })

  it('does not expose approved or other users requests when no editable request exists', async () => {
    findOne.mockResolvedValue(null)

    await expect(service.getClubManagerRequest(clubUuid, serviceUserId)).rejects.toBeInstanceOf(
      NotFoundError,
    )
    expect(findOne).toHaveBeenCalledTimes(2)
  })
})

const createUpdateService = (managerRequest: Partial<ClubManagerRegisterRequestEntity> | null) => {
  const managerRequestRepository = {
    findOne: vi.fn().mockResolvedValue(managerRequest),
    update: vi.fn().mockResolvedValue({ affected: 1 }),
  }
  const userNotificationRepository = {
    delete: vi.fn(),
  }
  const entityManager = {
    getRepository: vi.fn((entity) => {
      if (entity === ClubManagerRegisterRequestEntity) return managerRequestRepository
      if (entity === UserNotificationEntity) return userNotificationRepository
      throw new Error('unexpected repository')
    }),
  }
  const transaction = vi.fn(async (callback) => callback(entityManager))
  const service = Object.create(ClubService.prototype) as ClubService
  Object.defineProperty(service, 'clubManagerRegisterRequestRepository', {
    value: {
      manager: { transaction },
    },
  })

  return {
    service,
    managerRequestRepository,
    userNotificationRepository,
  }
}

describe('ClubService.updateClubManagerRequest', () => {
  it('updates a pending request without changing its status', async () => {
    const { service, managerRequestRepository, userNotificationRepository } = createUpdateService({
      id: '1',
      clubId: clubUuid,
      serviceUserId,
      status: 'PENDING',
    })

    await service.updateClubManagerRequest(clubUuid, serviceUserId, {
      phone: '010-9876-5432',
    })

    expect(managerRequestRepository.findOne).toHaveBeenCalledWith({
      where: {
        clubId: clubUuid,
        serviceUserId,
        status: 'PENDING',
      },
      order: {
        createdAt: 'DESC',
        id: 'DESC',
      },
      lock: {
        mode: 'pessimistic_write',
      },
    })
    expect(managerRequestRepository.update).toHaveBeenCalledWith(
      { id: '1' },
      { phone: '010-9876-5432' },
    )
    expect(userNotificationRepository.delete).not.toHaveBeenCalled()
  })

  it('resubmits a rejected request only when explicitly requested', async () => {
    const { service, managerRequestRepository, userNotificationRepository } = createUpdateService({
      id: '2',
      clubId: clubUuid,
      serviceUserId,
      status: 'REJECTED',
    })

    await service.updateClubManagerRequest(clubUuid, serviceUserId, {
      name: '홍길동',
      resubmit: true,
    })

    expect(managerRequestRepository.findOne).toHaveBeenCalledWith({
      where: {
        clubId: clubUuid,
        serviceUserId,
        status: 'REJECTED',
      },
      order: {
        createdAt: 'DESC',
        id: 'DESC',
      },
      lock: {
        mode: 'pessimistic_write',
      },
    })
    expect(managerRequestRepository.update).toHaveBeenCalledWith(
      { id: '2' },
      {
        name: '홍길동',
        status: 'PENDING',
        rejectReason: '',
        createdAt: expect.any(String),
      },
    )
    expect(userNotificationRepository.delete).toHaveBeenCalledWith({
      sourceType: 'CLUB_MANAGER_REQUEST',
      sourceId: '2',
      type: 'MANAGER_REQUEST_REJECTED',
    })
  })

  it('does not edit a rejected request without resubmit', async () => {
    const { service, managerRequestRepository } = createUpdateService(null)

    await expect(
      service.updateClubManagerRequest(clubUuid, serviceUserId, {
        phone: '010-9876-5432',
      }),
    ).rejects.toBeInstanceOf(NotFoundError)
    expect(managerRequestRepository.update).not.toHaveBeenCalled()
  })
})
