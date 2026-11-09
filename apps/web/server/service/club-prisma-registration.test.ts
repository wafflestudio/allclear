import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prisma, tx } = vi.hoisted(() => {
  const tx = {
    club: { create: vi.fn() },
    club_manager: { create: vi.fn() },
    college_major: { findFirst: vi.fn() },
  }
  return {
    prisma: {
      $transaction: vi.fn(async (callback) => callback(tx)),
      college_major: { findFirst: vi.fn() },
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

import { BadRequestError } from '../domain/error'
import type { ClubRegisterRequest } from '../http/schemas/managers'
import { ClubService } from './club.service'

const clubUuid = '123e4567-e89b-12d3-a456-426614174000'
const serviceUserId = '123e4567-e89b-12d3-a456-426614174001'
const request: ClubRegisterRequest = {
  club_data: {
    name: '동아리',
    type: '교내',
    image_uri: 'https://example.com/image.png',
    category: '학술',
    affiliation: '컴퓨터공학부',
    short_description: '한 줄 소개',
    recruit_type: '상시',
    min_activity_period: 3,
    has_dongbang: true,
    dongbang_location: '학생회관',
    sns_urls: ['https://example.com'],
    introduction: '소개',
    activity_image_urls: ['https://example.com/activity.png'],
  },
  manager_data: {
    name: '홍길동',
    phone: '010-1234-5678',
    student_id: '2021-12345',
  },
}

const createdClub = {
  id: BigInt(1),
  uuid: clubUuid,
  name: '동아리',
  description: '',
  short_description: '한 줄 소개',
  introduction: '소개',
  type: '교내',
  category: '학술',
  affiliation_type: '소속동아리',
  college_major_id: 9,
  recruit_type: '상시',
  is_official_verified: false,
  verified_at: null,
  has_dongbang: true,
  dongbang_location: '학생회관',
  min_activity_period: 3,
  active_member_count: 0,
  founded_at: null,
  sns_urls: ['https://example.com'],
  activity_image_urls: ['https://example.com/activity.png'],
  image_uri: 'https://example.com/image.png',
  article: null,
  article_uploaded_at: null,
  status: 'PENDING',
  reject_reason: '',
  approved_at: null,
  created_at: new Date('2026-10-11T00:00:00.000Z'),
  updated_at: new Date('2026-10-11T00:00:00.000Z'),
  deleted_at: null,
  sns: '',
}

beforeEach(() => {
  vi.clearAllMocks()
  prisma.college_major.findFirst.mockResolvedValue({ id: 9 })
  tx.club.create.mockResolvedValue(createdClub)
  tx.club_manager.create.mockResolvedValue({ id: 1 })
  tx.college_major.findFirst.mockResolvedValue({
    id: 9,
    college: '공과대학',
    major: '컴퓨터공학부',
  })
})

describe('ClubService Prisma registration', () => {
  it('creates the club and manager in one transaction and returns the affiliation', async () => {
    const result = await new ClubService().registerClub(serviceUserId, request)

    expect(prisma.college_major.findFirst).toHaveBeenCalledWith({
      where: { major: '컴퓨터공학부', deleted_at: null },
      select: { id: true },
    })
    expect(tx.club.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: '동아리',
        affiliation_type: '소속동아리',
        college_major_id: 9,
        recruit_type: '상시',
        status: 'PENDING',
        approved_at: null,
        reject_reason: '',
      }),
    })
    expect(tx.club_manager.create).toHaveBeenCalledWith({
      data: {
        club_id: clubUuid,
        service_user_id: serviceUserId,
        name: '홍길동',
        phone: '010-1234-5678',
        student_id: '2021-12345',
      },
    })
    expect(tx.college_major.findFirst).toHaveBeenCalledWith({
      where: { id: 9, deleted_at: null },
      select: { id: true, college: true, major: true },
    })
    expect(result).toMatchObject({
      uuid: clubUuid,
      collegeMajor: { id: 9, college: '공과대학', major: '컴퓨터공학부' },
    })
  })

  it('does not create a manager when club creation fails', async () => {
    tx.club.create.mockRejectedValueOnce(new Error('club create failed'))

    await expect(new ClubService().registerClub(serviceUserId, request)).rejects.toThrow(
      'club create failed',
    )
    expect(tx.club_manager.create).not.toHaveBeenCalled()
  })

  it('rejects an off-campus club before querying or writing', async () => {
    await expect(
      new ClubService().registerClub(serviceUserId, {
        ...request,
        club_data: { ...request.club_data, type: '교외' },
      }),
    ).rejects.toBeInstanceOf(BadRequestError)
    expect(prisma.college_major.findFirst).not.toHaveBeenCalled()
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('uses an active college when there is no matching major', async () => {
    prisma.college_major.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 5 })
    await new ClubService().registerClub(serviceUserId, {
      ...request,
      club_data: { ...request.club_data, affiliation: '공과대학' },
    })
    expect(prisma.college_major.findFirst).toHaveBeenNthCalledWith(2, {
      where: { college: '공과대학', major: null, deleted_at: null },
      select: { id: true },
    })
    expect(tx.club.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ college_major_id: 5 }),
    })
  })
})
