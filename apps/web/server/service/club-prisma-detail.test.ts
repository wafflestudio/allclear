import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prisma } = vi.hoisted(() => ({
  prisma: {
    club_manager: { findMany: vi.fn() },
    club_verification_request: { findUnique: vi.fn() },
  },
}))

vi.mock('../provider', () => ({
  Inject: () => () => undefined,
  InjectRepository: () => () => undefined,
  Service: () => undefined,
}))
vi.mock('../infra/database/prisma', () => ({ getPrismaClient: () => prisma }))

import { getOfficialVerificationTermKey } from '../domain/constants/official-verification-term'
import { ClubService } from './club.service'

const clubUuid = '123e4567-e89b-12d3-a456-426614174000'
const serviceUserId = '123e4567-e89b-12d3-a456-426614174001'
const club = {
  uuid: clubUuid,
  name: '동아리',
  description: '',
  shortDescription: '',
  introduction: null,
  type: '교내',
  category: '학술',
  affiliationType: '중앙동아리',
  collegeMajorId: null,
  collegeMajor: null,
  recruitType: '상시',
  isOfficialVerified: false,
  verifiedAt: null,
  hasDongbang: false,
  dongbangLocation: null,
  minActivityPeriod: 0,
  activeMemberCount: 0,
  foundedAt: null,
  snsUrls: [],
  activityImageUrls: [],
  imageUri: '',
  article: null,
  articleUploadedAt: null,
  status: 'APPROVED',
  rejectReason: null,
}

function createService() {
  const service = new ClubService()
  const assertManagedClub = vi.fn().mockResolvedValue(undefined)
  const getExistingClub = vi.fn().mockResolvedValue(club)
  const getPublicClub = vi.fn().mockResolvedValue(club)
  const getClubReviews = vi.fn().mockResolvedValue(new Map())
  Object.defineProperty(service, 'clubAccessService', {
    value: { assertManagedClub, getExistingClub, getPublicClub },
  })
  Object.defineProperty(service, 'getClubReviews', { value: getClubReviews })
  Object.defineProperty(service, 'userActivityLogRepository', {
    value: { insert: vi.fn().mockResolvedValue(undefined) },
  })
  return { service, assertManagedClub, getClubReviews }
}

beforeEach(() => {
  vi.resetAllMocks()
  prisma.club_manager.findMany.mockResolvedValue([])
  prisma.club_verification_request.findUnique.mockResolvedValue(null)
})

describe('ClubService Prisma detail reads', () => {
  it('returns the public verification status from the club request', async () => {
    prisma.club_verification_request.findUnique.mockResolvedValue({ status: 'PENDING' })
    const { service, getClubReviews } = createService()

    const detail = await service.findPublicByUuid(clubUuid)

    expect(detail.officialVerificationStatus).toBe('PENDING')
    expect(getClubReviews).toHaveBeenCalledWith([clubUuid])
    expect(prisma.club_verification_request.findUnique).toHaveBeenCalledWith({
      where: { club_id: clubUuid },
      select: { status: true },
    })
  })

  it('returns only active managers and the current term verification attempt', async () => {
    const createdAt = new Date('2026-10-01T00:00:00.000Z')
    prisma.club_manager.findMany.mockResolvedValue([
      {
        service_user_id: serviceUserId,
        name: '홍길동',
        phone: '010-1234-5678',
        student_id: '2021-12345',
      },
    ])
    prisma.club_verification_request.findUnique.mockResolvedValue({
      id: BigInt(8),
      status: 'REJECTED',
      term_key: getOfficialVerificationTermKey(),
      attempt_no: 2,
      reject_reason: '서류 부족',
      created_at: createdAt,
    })
    const { service, assertManagedClub } = createService()

    const detail = await service.getManagedClubByUuid(clubUuid, serviceUserId)

    expect(assertManagedClub).toHaveBeenCalledWith(clubUuid, serviceUserId)
    expect(prisma.club_manager.findMany).toHaveBeenCalledWith({
      where: { club_id: clubUuid, deleted_at: null },
      select: { service_user_id: true, name: true, phone: true, student_id: true },
    })
    expect(detail.managers).toEqual([
      {
        serviceUserId,
        name: '홍길동',
        phone: '010-1234-5678',
        studentId: '2021-12345',
      },
    ])
    expect(detail.officialVerification).toMatchObject({
      status: 'REJECTED',
      requestId: 8,
      attemptNo: 2,
      retryCount: 1,
      rejectReason: '서류 부족',
      requestedAt: createdAt.toISOString(),
    })
  })

  it('resets the displayed attempt count for a previous term', async () => {
    prisma.club_verification_request.findUnique.mockResolvedValue({
      id: BigInt(9),
      status: 'PENDING',
      term_key: '000000',
      attempt_no: 3,
      reject_reason: null,
      created_at: new Date('2026-01-01T00:00:00.000Z'),
    })
    const { service } = createService()

    const detail = await service.getManagedClubByUuid(clubUuid, serviceUserId)

    expect(detail.officialVerification).toMatchObject({
      status: 'PENDING',
      attemptNo: 1,
      retryCount: 0,
      rejectReason: null,
    })
  })
})
