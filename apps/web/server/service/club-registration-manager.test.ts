import { describe, expect, it, vi } from 'vitest'

vi.mock('../provider', () => ({
  Inject: () => () => undefined,
  InjectRepository: () => () => undefined,
  Service: () => undefined,
}))

import { ConflictError, ForbiddenError, NotFoundError } from '../domain/error'
import { ClubEntity, ClubHistoryEntity, UserNotificationEntity } from '../infra/database/entities'
import { ClubManagerEntity } from '../infra/database/entities/club-manager.entity'
import { ClubManagerRegisterRequestEntity } from '../infra/database/entities/club-manager-register-request.entity'
import { ClubService } from './club.service'

const clubUuid = '123e4567-e89b-12d3-a456-426614174000'
const serviceUserId = '123e4567-e89b-12d3-a456-426614174001'

function createService({
  club,
  ownedManager,
  anotherManager = null,
  managerRequest = null,
}: {
  club: Partial<ClubEntity> | null
  ownedManager: Partial<ClubManagerEntity> | null
  anotherManager?: Partial<ClubManagerEntity> | null
  managerRequest?: Partial<ClubManagerRegisterRequestEntity> | null
}) {
  const clubRepository = {
    findOneBy: vi.fn().mockResolvedValue(club),
  }
  const clubManagerRepository = {
    findOneBy: vi.fn().mockResolvedValueOnce(ownedManager).mockResolvedValueOnce(anotherManager),
  }
  const clubManagerRegisterRequestRepository = {
    findOneBy: vi.fn().mockResolvedValue(managerRequest),
  }
  const service = Object.create(ClubService.prototype) as ClubService

  Object.defineProperties(service, {
    clubRepository: { value: clubRepository },
    clubManagerRepository: { value: clubManagerRepository },
    clubManagerRegisterRequestRepository: { value: clubManagerRegisterRequestRepository },
  })

  return {
    service,
    clubRepository,
    clubManagerRepository,
    clubManagerRegisterRequestRepository,
  }
}

describe('club registration manager information', () => {
  it.each(['PENDING', 'REJECTED'] as const)(
    'returns only the current registration manager for a %s club',
    async (status) => {
      const { service, clubManagerRegisterRequestRepository } = createService({
        club: { uuid: clubUuid, status },
        ownedManager: {
          id: 1,
          clubId: clubUuid,
          serviceUserId,
          name: '홍길동',
          phone: '010-1234-5678',
          studentId: '2021-12345',
        },
      })

      await expect(service.getClubRegistrationManager(clubUuid, serviceUserId)).resolves.toEqual({
        name: '홍길동',
        phone: '010-1234-5678',
        student_id: '2021-12345',
      })
      expect(clubManagerRegisterRequestRepository.findOneBy).toHaveBeenCalledWith({
        clubId: clubUuid,
        serviceUserId,
      })
    },
  )

  it('rejects an approved club without exposing manager information', async () => {
    const { service } = createService({
      club: { uuid: clubUuid, status: 'APPROVED' },
      ownedManager: {
        id: 1,
        clubId: clubUuid,
        serviceUserId,
      },
    })

    await expect(
      service.getClubRegistrationManager(clubUuid, serviceUserId),
    ).rejects.toBeInstanceOf(ConflictError)
  })

  it('rejects a manager relation created by the manager-requests flow', async () => {
    const { service } = createService({
      club: { uuid: clubUuid, status: 'REJECTED' },
      ownedManager: {
        id: 1,
        clubId: clubUuid,
        serviceUserId,
      },
      managerRequest: {
        id: '1',
        clubId: clubUuid,
        serviceUserId,
        status: 'APPROVED',
      },
    })

    await expect(
      service.getClubRegistrationManager(clubUuid, serviceUserId),
    ).rejects.toBeInstanceOf(ForbiddenError)
  })

  it('returns forbidden when the club belongs to another manager', async () => {
    const { service } = createService({
      club: { uuid: clubUuid, status: 'PENDING' },
      ownedManager: null,
      anotherManager: {
        id: 2,
        clubId: clubUuid,
        serviceUserId: '123e4567-e89b-12d3-a456-426614174002',
      },
    })

    await expect(
      service.getClubRegistrationManager(clubUuid, serviceUserId),
    ).rejects.toBeInstanceOf(ForbiddenError)
  })

  it('returns not found when the club has no manager information', async () => {
    const { service } = createService({
      club: { uuid: clubUuid, status: 'PENDING' },
      ownedManager: null,
    })

    await expect(
      service.getClubRegistrationManager(clubUuid, serviceUserId),
    ).rejects.toBeInstanceOf(NotFoundError)
  })

  it('rejects a rejected registration update without resubmit', async () => {
    const clubRepository = {
      findOne: vi.fn().mockResolvedValue({ uuid: clubUuid, status: 'REJECTED' }),
      update: vi.fn().mockResolvedValue({ affected: 1 }),
      findOneByOrFail: vi.fn().mockResolvedValue({
        uuid: clubUuid,
        status: 'REJECTED',
        updatedAt: '2026-07-26T00:00:00.000Z',
      }),
    }
    const clubManagerRepository = {
      findOneBy: vi.fn().mockResolvedValue({
        id: 1,
        clubId: clubUuid,
        serviceUserId,
      }),
      update: vi.fn().mockResolvedValue({ affected: 1 }),
    }
    const clubManagerRegisterRequestRepository = {
      findOneBy: vi.fn().mockResolvedValue(null),
    }
    const clubHistoryRepository = {
      insert: vi.fn(),
    }
    const userNotificationRepository = {
      delete: vi.fn(),
    }
    const entityManager = {
      getRepository: vi.fn((entity) => {
        if (entity === ClubEntity) return clubRepository
        if (entity === ClubManagerEntity) return clubManagerRepository
        if (entity === ClubManagerRegisterRequestEntity) {
          return clubManagerRegisterRequestRepository
        }
        if (entity === ClubHistoryEntity) return clubHistoryRepository
        if (entity === UserNotificationEntity) return userNotificationRepository
        throw new Error('unexpected repository')
      }),
    }
    const transaction = vi.fn(async (callback) => callback(entityManager))
    const service = Object.create(ClubService.prototype) as ClubService
    Object.defineProperty(service, 'clubRepository', {
      value: {
        manager: { transaction },
      },
    })

    await expect(
      service.patchManagedClub(clubUuid, serviceUserId, {
        club_data: {
          short_description: '수정된 한줄소개',
        },
        manager_data: {
          phone: '010-9876-5432',
        },
      }),
    ).rejects.toBeInstanceOf(ConflictError)

    expect(clubRepository.findOne).toHaveBeenCalledWith({
      where: {
        uuid: clubUuid,
        deletedAt: expect.anything(),
      },
      loadEagerRelations: false,
      lock: {
        mode: 'pessimistic_write',
      },
    })
    expect(clubManagerRepository.update).not.toHaveBeenCalled()
    expect(clubRepository.update).not.toHaveBeenCalled()
    expect(clubHistoryRepository.insert).not.toHaveBeenCalled()
    expect(userNotificationRepository.delete).not.toHaveBeenCalled()
  })

  it('resubmits a rejected registration without other changes when explicitly requested', async () => {
    const clubRepository = {
      findOne: vi.fn().mockResolvedValue({ uuid: clubUuid, status: 'REJECTED' }),
      update: vi.fn().mockResolvedValue({ affected: 1 }),
      findOneByOrFail: vi.fn().mockResolvedValue({
        uuid: clubUuid,
        status: 'PENDING',
        updatedAt: '2026-07-26T00:00:00.000Z',
      }),
    }
    const clubManagerRepository = {
      findOneBy: vi.fn().mockResolvedValue({
        id: 1,
        clubId: clubUuid,
        serviceUserId,
      }),
      update: vi.fn(),
    }
    const clubManagerRegisterRequestRepository = {
      findOneBy: vi.fn().mockResolvedValue(null),
    }
    const clubHistoryRepository = {
      insert: vi.fn(),
    }
    const userNotificationRepository = {
      delete: vi.fn(),
    }
    const entityManager = {
      getRepository: vi.fn((entity) => {
        if (entity === ClubEntity) return clubRepository
        if (entity === ClubManagerEntity) return clubManagerRepository
        if (entity === ClubManagerRegisterRequestEntity) {
          return clubManagerRegisterRequestRepository
        }
        if (entity === ClubHistoryEntity) return clubHistoryRepository
        if (entity === UserNotificationEntity) return userNotificationRepository
        throw new Error('unexpected repository')
      }),
    }
    const transaction = vi.fn(async (callback) => callback(entityManager))
    const service = Object.create(ClubService.prototype) as ClubService
    Object.defineProperty(service, 'clubRepository', {
      value: {
        manager: { transaction },
      },
    })

    await service.patchManagedClub(clubUuid, serviceUserId, { resubmit: true })

    expect(clubRepository.update).toHaveBeenCalledWith(
      {
        uuid: clubUuid,
        deletedAt: expect.anything(),
      },
      {
        status: 'PENDING',
        rejectReason: '',
      },
    )
    expect(clubManagerRepository.update).not.toHaveBeenCalled()
    expect(userNotificationRepository.delete).toHaveBeenCalledWith({
      sourceType: 'CLUB',
      sourceId: clubUuid,
      type: 'CLUB_REGISTRATION_REJECTED',
    })
  })
})
