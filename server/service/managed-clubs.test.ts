import { describe, expect, it, vi } from 'vitest'

vi.mock('../provider', () => ({
  Inject: () => () => undefined,
  InjectRepository: () => () => undefined,
  Service: () => undefined,
}))

import { ClubEntity } from '../infra/database/entities'
import { ClubService } from './club.service'

const createClub = (uuid: string, name: string): ClubEntity =>
  ({
    uuid,
    name,
    fullName: name,
    description: '',
    shortDescription: '',
    introduction: '',
    type: '교내',
    category: '학술',
    college: '',
    affiliationType: '중앙동아리',
    collegeMajorId: null,
    collegeMajor: null,
    recruitType: '상시',
    isOfficialVerified: false,
    verifiedAt: null,
    isPopular: false,
    hasDongbang: false,
    dongbangLocation: '',
    activityCycle: '',
    minActivityPeriod: 0,
    activeMemberCount: 0,
    foundedAt: null,
    membershipFee: '',
    snsUrls: [],
    activityImageUrls: [],
    tags: [],
    imageUri: '',
    thumbnailUri: null,
    blurHash: null,
    blurImage: null,
    article: '',
    articleUploadedAt: null,
    authkey: uuid,
    approvedAt: null,
    status: 'APPROVED',
    rejectReason: '',
    createdAt: '2026-07-26T00:00:00.000Z',
    updatedAt: '2026-07-26T00:00:00.000Z',
    deletedAt: null,
  } as ClubEntity)

describe('ClubService.findAllManagedByUser', () => {
  it('returns hasManager when any user manages the club', async () => {
    const managedClub = createClub('123e4567-e89b-12d3-a456-426614174000', '관리 동아리')
    const requestedClubWithManager = createClub(
      '123e4567-e89b-12d3-a456-426614174001',
      '운영진 있는 신청 동아리',
    )
    const requestedClubWithoutManager = createClub(
      '123e4567-e89b-12d3-a456-426614174002',
      '운영진 없는 신청 동아리',
    )
    const service = Object.create(ClubService.prototype) as ClubService
    const findClubManagers = vi
      .fn()
      .mockResolvedValueOnce([
        {
          clubId: managedClub.uuid,
          createdAt: '2026-07-26T00:00:00.000Z',
        },
      ])
      .mockResolvedValueOnce([
        { clubId: managedClub.uuid },
        { clubId: requestedClubWithManager.uuid },
      ])

    Object.defineProperties(service, {
      clubManagerRepository: {
        value: {
          find: findClubManagers,
        },
      },
      clubManagerRegisterRequestRepository: {
        value: {
          find: vi.fn().mockResolvedValue([
            {
              id: '1',
              clubId: requestedClubWithManager.uuid,
              status: 'PENDING',
              createdAt: '2026-07-26T00:00:00.000Z',
            },
            {
              id: '2',
              clubId: requestedClubWithoutManager.uuid,
              status: 'PENDING',
              createdAt: '2026-07-26T00:00:00.000Z',
            },
          ]),
        },
      },
      clubRepository: {
        value: {
          findBy: vi
            .fn()
            .mockResolvedValue([
              managedClub,
              requestedClubWithManager,
              requestedClubWithoutManager,
            ]),
        },
      },
      findLatestRecruitmentUpdatedAtByClubId: {
        value: vi.fn().mockResolvedValue(new Map()),
      },
    })

    const result = await service.findAllManagedByUser('123e4567-e89b-12d3-a456-426614174002')

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          uuid: managedClub.uuid,
          managementStatus: 'APPROVED',
          hasManager: true,
        }),
        expect.objectContaining({
          uuid: requestedClubWithManager.uuid,
          managementStatus: 'MANAGER_REQUEST_PENDING',
          hasManager: true,
        }),
        expect.objectContaining({
          uuid: requestedClubWithoutManager.uuid,
          managementStatus: 'MANAGER_REQUEST_PENDING',
          hasManager: false,
        }),
      ]),
    )

    expect(findClubManagers).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        select: { clubId: true },
        where: { clubId: expect.anything() },
      }),
    )
  })
})
