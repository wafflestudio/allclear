import { expect, it, vi } from 'vitest'

const { prisma } = vi.hoisted(() => ({
  prisma: { college_major: { findMany: vi.fn() } },
}))

vi.mock('server/infra/database/prisma', () => ({ getPrismaClient: () => prisma }))

import type { club as PrismaClub } from 'server/infra/database/generated/prisma/client'
import { toClubDomainSources } from './search-club-source'

it('attaches the college major to each club', async () => {
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
  } as unknown as PrismaClub
  prisma.college_major.findMany.mockResolvedValue([{ id: 2, college: 'College', major: 'Major' }])

  const sources = await toClubDomainSources([club])

  expect(sources).toHaveLength(1)
  expect(sources[0]).toMatchObject({
    uuid: 'club-1',
    collegeMajor: { id: 2, college: 'College', major: 'Major' },
    foundedAt: '2020-01-02',
    snsUrls: ['https://example.com'],
    status: 'APPROVED',
  })
  expect(prisma.college_major.findMany.mock.calls[0][0].where).toEqual({
    id: { in: [2] },
    deleted_at: null,
  })
})
