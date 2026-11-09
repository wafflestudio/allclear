import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prisma, tx } = vi.hoisted(() => {
  const recruitment = {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
  }
  const meeting = { deleteMany: vi.fn() }
  const tx = {
    $queryRaw: vi.fn(),
    $executeRaw: vi.fn(),
    club_recruitment: {
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    regular_meeting: { deleteMany: vi.fn() },
    club: { updateMany: vi.fn() },
  }
  return {
    tx,
    prisma: {
      club_recruitment: recruitment,
      regular_meeting: meeting,
      $queryRaw: vi.fn(),
      $transaction: vi.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
    },
  }
})

vi.mock('../provider', () => ({ Inject: () => () => undefined, Service: () => undefined }))
vi.mock('../infra/database/prisma', () => ({ getPrismaClient: () => prisma }))

import { ConflictError, NotFoundError } from '../domain/error'
import { CreateClubRecruitmentSchema } from '../http/schemas/club-recruitments'
import { Prisma } from '../infra/database/generated/prisma/client'
import { ClubRecruitmentService } from './club-recruitment.service'

const clubUuid = '4dfcd19f-9f20-4128-8b4c-b76deab4b65d'
const now = new Date('2026-10-11T09:00:00.000Z')
const recruitment = (id: bigint = BigInt(1)) => ({
  id,
  club_id: clubUuid,
  title: '모집',
  deadline: new Date('2026-11-01T00:00:00.000Z'),
  is_mandatory: false,
  has_regular_meeting: true,
  activity_location_type: '미정',
  activity_location_text: '',
  has_eligibility: false,
  eligibility_text: '',
  has_capacity_limit: false,
  capacity_limit_text: '',
  has_membership_fee: false,
  membership_fee_text: '',
  application_url: 'https://example.com',
  application_process: '면접',
  full_recruitment_text: null,
  image_urls: ['https://example.com/image'],
  year_month: '2026-10',
  created_at: now,
  updated_at: now,
  deleted_at: null,
})
const meeting = (id: bigint = BigInt(4)) => ({
  id,
  club_recruitment_id: BigInt(1),
  day_of_week: '월요일',
  start_time: '09:30:00.123456',
  end_time: '10:30:00',
})
const input = CreateClubRecruitmentSchema.parse({
  title: '모집',
  deadline: '2026-11-01T00:00:00.000Z',
  is_mandatory: false,
  has_regular_meeting: true,
  regular_meetings: [{ day_of_week: '월요일', start_time: '09:30', end_time: '10:30' }],
  activity_location_type: '미정',
  has_eligibility: false,
  has_capacity_limit: false,
  has_membership_fee: false,
  application_url: 'https://example.com',
  application_process: '면접',
})
const createService = () => {
  const service = new ClubRecruitmentService()
  const access = {
    getPublicClub: vi.fn().mockResolvedValue({ name: '동아리' }),
    assertManagedClub: vi.fn().mockResolvedValue(undefined),
  }
  Object.defineProperty(service, 'clubAccessService', { value: access })
  return { service, access }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(now)
  prisma.club_recruitment.findMany.mockResolvedValue([])
  prisma.club_recruitment.findFirst.mockResolvedValue(recruitment())
  prisma.$queryRaw.mockResolvedValue([meeting()])
  tx.club_recruitment.create.mockResolvedValue(recruitment())
  tx.club_recruitment.findFirst.mockResolvedValue(recruitment())
  tx.club_recruitment.updateMany.mockResolvedValue({ count: 1 })
  tx.$queryRaw.mockResolvedValue([meeting()])
})

describe('ClubRecruitmentService with Prisma', () => {
  it('lists active recruitments with their regular meetings and the existing response format', async () => {
    const { service } = createService()
    prisma.club_recruitment.findMany.mockResolvedValue([recruitment()])
    const result = await service.findPublicRecruitmentsByClub(clubUuid)
    expect(prisma.club_recruitment.findMany).toHaveBeenCalledWith({
      where: { club_id: clubUuid, deleted_at: null },
      orderBy: { created_at: 'desc' },
    })
    expect(result).toMatchObject({
      clubName: '동아리',
      recruitments: [
        {
          id: '1',
          deadline: '2026-11-01T00:00:00.000Z',
          regularMeetings: [{ id: '4', dayOfWeek: '월요일', startTime: '09:30:00.123456' }],
        },
      ],
    })
  })

  it('selects the latest year and month for a representative recruitment', async () => {
    const { service } = createService()
    await service.findPublicRepresentativeRecruitmentByClub(clubUuid)
    expect(prisma.club_recruitment.findFirst).toHaveBeenCalledWith({
      where: { club_id: clubUuid, deleted_at: null },
      orderBy: [{ year_month: 'desc' }, { created_at: 'desc' }],
    })
  })

  it('creates the recruitment, meetings, and club touch in one transaction', async () => {
    const { service, access } = createService()
    await service.createRecruitment(clubUuid, 'user-1', input)
    expect(access.assertManagedClub).toHaveBeenCalledWith(clubUuid, 'user-1')
    expect(tx.club_recruitment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        club_id: clubUuid,
        year_month: '2026-10',
        created_at: now,
        deadline: new Date(input.deadline),
      }),
    })
    expect(tx.$executeRaw).toHaveBeenCalledTimes(1)
    const [sql, meetingRecruitmentId, day, start, end] = tx.$executeRaw.mock.calls[0]
    expect(sql.join('')).toContain('INSERT INTO regular_meeting')
    expect([meetingRecruitmentId, day, start, end]).toEqual([BigInt(1), '월요일', '09:30', '10:30'])
    expect(tx.club.updateMany).toHaveBeenCalledWith({
      where: { uuid: clubUuid, deleted_at: null },
      data: { article_uploaded_at: now },
    })
  })

  it('passes TIME(6) text and nullable times to PostgreSQL without Date conversion', async () => {
    const { service } = createService()
    await service.createRecruitment(clubUuid, 'user-1', {
      ...input,
      regular_meetings: [{ day_of_week: '월요일', start_time: '09:30:00.123456', end_time: null }],
    })
    const [, , , start, end] = tx.$executeRaw.mock.calls[0]
    expect([start, end]).toEqual(['09:30:00.123456', null])
  })

  it('replaces meetings only when the update includes them', async () => {
    const { service } = createService()
    await service.updateRecruitment('1', 'user-1', { title: '새 제목' })
    expect(tx.regular_meeting.deleteMany).not.toHaveBeenCalled()
    expect(tx.club_recruitment.updateMany).toHaveBeenCalledWith({
      where: { id: BigInt(1), deleted_at: null },
      data: { title: '새 제목', updated_at: now },
    })
    await service.updateRecruitment('1', 'user-1', { regular_meetings: [] })
    expect(tx.regular_meeting.deleteMany).toHaveBeenCalledWith({
      where: { club_recruitment_id: BigInt(1) },
    })
    expect(tx.$executeRaw).not.toHaveBeenCalled()
  })

  it('soft-deletes only an active recruitment', async () => {
    const { service } = createService()
    await service.deleteRecruitment('1', 'user-1')
    expect(prisma.club_recruitment.updateMany).toHaveBeenCalledWith({
      where: { id: BigInt(1), deleted_at: null },
      data: { deleted_at: now },
    })
  })

  it('rejects a missing recruitment', async () => {
    const { service } = createService()
    prisma.club_recruitment.findFirst.mockResolvedValue(null)
    await expect(service.deleteRecruitment('1', 'user-1')).rejects.toBeInstanceOf(NotFoundError)
  })

  it('maps the monthly unique index conflict to a domain conflict', async () => {
    const { service } = createService()
    tx.club_recruitment.create.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '7.10.0',
        meta: { target: 'idx_unique_club_month_active' },
      }),
    )
    await expect(service.createRecruitment(clubUuid, 'user-1', input)).rejects.toBeInstanceOf(
      ConflictError,
    )
  })

  it('maps Prisma field targets for the monthly unique conflict', async () => {
    const { service } = createService()
    tx.club_recruitment.create.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '7.10.0',
        meta: { target: ['club_id', 'year_month'] },
      }),
    )
    await expect(service.createRecruitment(clubUuid, 'user-1', input)).rejects.toBeInstanceOf(
      ConflictError,
    )
  })
})
