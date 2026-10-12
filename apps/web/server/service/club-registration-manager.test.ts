import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prisma } = vi.hoisted(() => ({
  prisma: {
    club: { findFirst: vi.fn() },
    club_manager: { findFirst: vi.fn() },
    club_manager_request: { findFirst: vi.fn() },
  },
}))

vi.mock('../provider', () => ({
  Inject: () => () => undefined,
  InjectRepository: () => () => undefined,
  Service: () => undefined,
}))
vi.mock('../infra/database/prisma', () => ({ getPrismaClient: () => prisma }))

import { ConflictError, ForbiddenError, NotFoundError } from '../domain/error'
import { ClubService } from './club.service'

type ClubFixture = { uuid?: string; status?: string }
type ManagerFixture = {
  id?: number
  clubId?: string
  serviceUserId?: string
  name?: string
  phone?: string
  studentId?: string
}
type ManagerRequestFixture = {
  id?: string
  clubId?: string
  serviceUserId?: string
  status?: string
}

const clubUuid = '123e4567-e89b-12d3-a456-426614174000'
const serviceUserId = '123e4567-e89b-12d3-a456-426614174001'

function createService({
  club,
  ownedManager,
  anotherManager = null,
  managerRequest = null,
}: {
  club: ClubFixture | null
  ownedManager: ManagerFixture | null
  anotherManager?: ManagerFixture | null
  managerRequest?: ManagerRequestFixture | null
}) {
  prisma.club.findFirst.mockResolvedValue(club)
  prisma.club_manager.findFirst
    .mockResolvedValueOnce(
      ownedManager && {
        name: ownedManager.name,
        phone: ownedManager.phone,
        student_id: ownedManager.studentId,
      },
    )
    .mockResolvedValueOnce(anotherManager)
  prisma.club_manager_request.findFirst.mockResolvedValue(managerRequest)
  const service = Object.create(ClubService.prototype) as ClubService
  return { service }
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('club registration manager information', () => {
  it.each(['PENDING', 'REJECTED'] as const)(
    'returns only the current registration manager for a %s club',
    async (status) => {
      const { service } = createService({
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
      expect(prisma.club_manager_request.findFirst).toHaveBeenCalledWith({
        where: { club_id: clubUuid, service_user_id: serviceUserId },
        select: { id: true },
      })
      expect(prisma.club_manager.findFirst).toHaveBeenCalledWith({
        where: { club_id: clubUuid, service_user_id: serviceUserId, deleted_at: null },
        select: { name: true, phone: true, student_id: true },
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
})
