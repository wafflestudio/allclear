import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prisma } = vi.hoisted(() => ({
  prisma: {
    $queryRaw: vi.fn(),
    club: { findMany: vi.fn() },
    college_major: { findMany: vi.fn() },
  },
}))

vi.mock('server/provider', () => ({ Service: () => undefined }))
vi.mock('server/infra/database/prisma', () => ({ getPrismaClient: () => prisma }))

import { buildSearchFilter } from './search-filter'
import { SearchQueryService } from './search-query.service'

beforeEach(() => {
  vi.clearAllMocks()
  prisma.college_major.findMany.mockResolvedValue([])
  prisma.club.findMany.mockResolvedValue([])
  prisma.$queryRaw.mockResolvedValue([])
})

describe('Prisma search filters', () => {
  it('combines exact activity periods with three or more', async () => {
    await expect(
      buildSearchFilter({ affiliationType: '중앙', minActivityPeriods: ['1', '3_plus'] }),
    ).resolves.toEqual({
      affiliation_type: '중앙',
      OR: [{ min_activity_period: { in: [1] } }, { min_activity_period: { gte: 3 } }],
    })
  })

  it('excludes only actively recruiting clubs when isRecruiting is false alone', async () => {
    prisma.$queryRaw.mockResolvedValue([{ club_id: 'active-club' }])
    await expect(buildSearchFilter({ isRecruiting: false })).resolves.toEqual({
      uuid: { notIn: ['active-club'] },
    })
    const [sql, , deadlineCondition] = prisma.$queryRaw.mock.calls[0]
    expect(deadlineCondition.sql).toContain('latest.deadline > NOW()')
    expect(sql.join('')).toContain('recruitment.deleted_at IS NULL')
    expect(sql.join('')).toContain('recruitment.year_month DESC, recruitment.created_at DESC')
  })

  it('requires an existing matching recruitment when a membership fee filter is present', async () => {
    prisma.$queryRaw.mockResolvedValue([{ club_id: 'closed-club' }])
    await expect(
      buildSearchFilter({ hasMembershipFee: false, isRecruiting: false }),
    ).resolves.toEqual({
      uuid: { in: ['closed-club'] },
    })
    const [, feeCondition, deadlineCondition] = prisma.$queryRaw.mock.calls[0]
    expect(feeCondition.sql).toContain('latest.has_membership_fee = ')
    expect(feeCondition.values).toEqual([false])
    expect(deadlineCondition.sql).toContain('latest.deadline <= NOW()')
  })
})

describe('SearchQueryService with Prisma', () => {
  it('searches active public clubs and maps deduplicated results with college major', async () => {
    const club = {
      uuid: 'club-1',
      name: 'Music',
      description: 'description',
      short_description: 'short',
      introduction: null,
      type: 'type',
      category: 'category',
      affiliation_type: '중앙',
      college_major_id: 2,
      recruit_type: null,
      is_official_verified: false,
      verified_at: null,
      has_dongbang: true,
      dongbang_location: null,
      min_activity_period: 1,
      active_member_count: 10,
      founded_at: new Date('2020-01-02T00:00:00.000Z'),
      sns_urls: ['https://example.com'],
      activity_image_urls: [],
      image_uri: 'image',
      article: null,
      article_uploaded_at: null,
      status: 'APPROVED',
      reject_reason: null,
    }
    prisma.college_major.findMany
      .mockResolvedValueOnce([{ id: 2 }])
      .mockResolvedValueOnce([{ id: 2, college: 'College', major: 'Major' }])
    prisma.club.findMany.mockResolvedValueOnce([club]).mockResolvedValueOnce([club])

    const result = await new SearchQueryService().search('music', { hasDongbang: true })

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      uuid: 'club-1',
      collegeMajor: { id: 2, college: 'College', major: 'Major' },
      foundedAt: '2020-01-02',
      snsUrls: ['https://example.com'],
      status: 'APPROVED',
    })
    expect(prisma.club.findMany).toHaveBeenCalledTimes(2)
    expect(prisma.club.findMany.mock.calls[0][0].where.AND[0]).toEqual({
      status: 'APPROVED',
      deleted_at: null,
      has_dongbang: true,
    })
    expect(prisma.club.findMany.mock.calls[1][0].where.AND[1]).toEqual({
      college_major_id: { in: [2] },
    })
    expect(prisma.college_major.findMany.mock.calls[0][0].where.deleted_at).toBeNull()
    expect(prisma.college_major.findMany.mock.calls[1][0].where.deleted_at).toBeNull()
  })
})
