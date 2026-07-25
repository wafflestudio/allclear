import { describe, expect, it, vi } from 'vitest'

vi.mock('../provider', () => ({
  Inject: () => () => undefined,
  InjectRepository: () => () => undefined,
  Service: () => undefined,
}))

import { ConflictError, ForbiddenError, NotFoundError } from '../domain/error'
import { ClubEntity } from '../infra/database/entities'
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

  it('updates only supplied manager fields without changing registration status', async () => {
    const clubRepository = {
      findOne: vi.fn().mockResolvedValue({ uuid: clubUuid, status: 'REJECTED' }),
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
    const entityManager = {
      getRepository: vi.fn((entity) => {
        if (entity === ClubEntity) return clubRepository
        if (entity === ClubManagerEntity) return clubManagerRepository
        if (entity === ClubManagerRegisterRequestEntity) {
          return clubManagerRegisterRequestRepository
        }
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

    await service.updateClubRegistrationManager(clubUuid, serviceUserId, {
      phone: '010-9876-5432',
    })

    expect(clubRepository.findOne).toHaveBeenCalledWith({
      where: {
        uuid: clubUuid,
        deletedAt: expect.anything(),
      },
      lock: {
        mode: 'pessimistic_write',
      },
    })
    expect(clubManagerRepository.update).toHaveBeenCalledWith({ id: 1 }, { phone: '010-9876-5432' })
  })
})
