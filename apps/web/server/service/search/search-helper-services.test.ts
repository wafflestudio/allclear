import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prisma, toClubDomain } = vi.hoisted(() => ({
  prisma: {
    club: { findMany: vi.fn() },
    club_manager: { findMany: vi.fn() },
  },
  toClubDomain: vi.fn((club: { uuid: string }, review: unknown) => ({
    uuid: club.uuid,
    review,
  })),
}))

vi.mock('server/provider', () => ({ Service: () => undefined, Inject: () => () => undefined }))
vi.mock('server/infra/database/prisma', () => ({ getPrismaClient: () => prisma }))
vi.mock('server/domain/model/Club', () => ({ toClubDomain }))
vi.mock('../club.service', () => ({ ClubService: class ClubService {} }))

import type { ClubDomainSource } from 'server/domain/model/Club'
import { SearchResultHydratorService } from './search-result-hydrator.service'
import { SearchTypoCorrectionService } from './search-typo-correction.service'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('SearchTypoCorrectionService with Prisma', () => {
  it('does not query clubs for a one-character search', async () => {
    await expect(new SearchTypoCorrectionService().findCorrectedQuery('a')).resolves.toBeNull()
    expect(prisma.club.findMany).not.toHaveBeenCalled()
  })

  it('uses active public club names and descriptions for typo correction', async () => {
    prisma.club.findMany.mockResolvedValue([
      { name: 'music', short_description: 'club activities' },
    ])
    await expect(new SearchTypoCorrectionService().findCorrectedQuery('musc')).resolves.toBe(
      'music',
    )
    expect(prisma.club.findMany).toHaveBeenCalledWith({
      select: { name: true, short_description: true },
      where: { status: 'APPROVED', deleted_at: null },
    })
  })
})

describe('SearchResultHydratorService with Prisma', () => {
  const createService = () => {
    const service = new SearchResultHydratorService()
    const getClubReviews = vi.fn().mockResolvedValue(new Map([['club-1', { totalReviews: 2 }]]))
    Object.defineProperty(service, 'clubService', { value: { getClubReviews } })
    return { service, getClubReviews }
  }

  it('skips the review and manager queries for an empty result', async () => {
    const { service, getClubReviews } = createService()
    await expect(service.toClubs([])).resolves.toEqual([])
    expect(getClubReviews).not.toHaveBeenCalled()
    expect(prisma.club_manager.findMany).not.toHaveBeenCalled()
  })

  it('deduplicates clubs and marks only active manager clubs', async () => {
    const { service, getClubReviews } = createService()
    prisma.club_manager.findMany.mockResolvedValue([{ club_id: 'club-2' }])
    const entities = [
      { uuid: 'club-1' },
      { uuid: 'club-1' },
      { uuid: 'club-2' },
    ] as ClubDomainSource[]

    await expect(service.toClubs(entities)).resolves.toEqual([
      { uuid: 'club-1', review: { totalReviews: 2 }, hasManager: false },
      { uuid: 'club-2', review: undefined, hasManager: true },
    ])
    expect(getClubReviews).toHaveBeenCalledWith(['club-1', 'club-2'])
    expect(prisma.club_manager.findMany).toHaveBeenCalledWith({
      select: { club_id: true },
      where: { club_id: { in: ['club-1', 'club-2'] }, deleted_at: null },
    })
    expect(toClubDomain).toHaveBeenCalledTimes(2)
  })
})
