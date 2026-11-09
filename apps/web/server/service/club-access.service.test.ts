import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prisma } = vi.hoisted(() => ({
  prisma: {
    club: { findFirst: vi.fn() },
    club_manager: { findFirst: vi.fn() },
    college_major: { findFirst: vi.fn() },
  },
}))

vi.mock('../provider', () => ({ Service: () => undefined }))
vi.mock('../infra/database/prisma', () => ({ getPrismaClient: () => prisma }))

import { ForbiddenError, NotFoundError } from '../domain/error'
import { ClubAccessService } from './club-access.service'

const club = {
  uuid: 'club-1',
  name: 'Music',
  description: '',
  short_description: 'short',
  introduction: null,
  type: '',
  category: '',
  affiliation_type: '',
  college_major_id: 2,
  recruit_type: null,
  is_official_verified: false,
  verified_at: null,
  has_dongbang: false,
  dongbang_location: null,
  min_activity_period: 0,
  active_member_count: 0,
  founded_at: null,
  sns_urls: [],
  activity_image_urls: [],
  image_uri: '',
  article: null,
  article_uploaded_at: null,
  status: 'APPROVED',
  reject_reason: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  prisma.club.findFirst.mockResolvedValue(club)
  prisma.college_major.findFirst.mockResolvedValue({ id: 2, college: 'College', major: 'Major' })
})

describe('ClubAccessService with Prisma', () => {
  it('loads a public club and its active college major', async () => {
    const result = await new ClubAccessService().getPublicClub('club-1')
    expect(prisma.club.findFirst).toHaveBeenCalledWith({
      where: { uuid: 'club-1', status: 'APPROVED', deleted_at: null },
    })
    expect(prisma.college_major.findFirst).toHaveBeenCalledWith({
      where: { id: 2, deleted_at: null },
      select: { id: true, college: true, major: true },
    })
    expect(result).toMatchObject({
      uuid: 'club-1',
      shortDescription: 'short',
      collegeMajor: { id: 2, college: 'College', major: 'Major' },
    })
  })

  it('rejects a missing or non-public club', async () => {
    prisma.club.findFirst.mockResolvedValue(null)
    await expect(new ClubAccessService().getPublicClub('missing')).rejects.toBeInstanceOf(
      NotFoundError,
    )
    expect(prisma.college_major.findFirst).not.toHaveBeenCalled()
  })

  it('requires an active manager for an existing club', async () => {
    prisma.club.findFirst.mockResolvedValue({ uuid: 'club-1' })
    prisma.club_manager.findFirst.mockResolvedValue(null)
    await expect(
      new ClubAccessService().assertManagedClub('club-1', 'user-1'),
    ).rejects.toBeInstanceOf(ForbiddenError)
    expect(prisma.club_manager.findFirst).toHaveBeenCalledWith({
      where: { club_id: 'club-1', service_user_id: 'user-1', deleted_at: null },
      select: { id: true },
    })
    prisma.club_manager.findFirst.mockResolvedValue({ id: 1 })
    await expect(
      new ClubAccessService().assertManagedClub('club-1', 'user-1'),
    ).resolves.toBeUndefined()
  })

  it('reports a missing club before manager authorization', async () => {
    prisma.club.findFirst.mockResolvedValue(null)
    prisma.club_manager.findFirst.mockResolvedValue(null)
    await expect(
      new ClubAccessService().assertManagedClub('missing', 'user-1'),
    ).rejects.toBeInstanceOf(NotFoundError)
  })
})
