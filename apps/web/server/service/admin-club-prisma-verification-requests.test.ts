import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prisma } = vi.hoisted(() => ({ prisma: { $queryRaw: vi.fn() } }))

vi.mock('../provider', () => ({ Service: () => undefined }))
vi.mock('../infra/database/prisma', () => ({ getPrismaClient: () => prisma }))

import { AdminClubService } from './admin-club.service'

const clubUuid = '123e4567-e89b-12d3-a456-426614174000'
const request = {
  id: BigInt(42),
  club_uuid: clubUuid,
  club_name: '동아리',
  category: '학술',
  status: 'REJECTED',
  reject_reason: '서류 부족',
  created_at: new Date('2026-10-01T00:00:00.000Z'),
}

beforeEach(() => {
  vi.resetAllMocks()
  prisma.$queryRaw
    .mockResolvedValueOnce([{ total_count: BigInt(12) }])
    .mockResolvedValueOnce([request])
})

describe('AdminClubService Prisma verification request list', () => {
  it('applies the same filters to the count and page and maps the response', async () => {
    const result = await new AdminClubService().getAdminClubVerificationRequests({
      status: 'REJECTED',
      affiliation_type: '소속동아리',
      exclude_affiliation_type: '중앙동아리',
      offset: 20,
      limit: 10,
    })

    expect(prisma.$queryRaw).toHaveBeenCalledTimes(2)
    const [countSql, countFrom] = prisma.$queryRaw.mock.calls[0]
    const [pageSql, pageFrom, offset, limit] = prisma.$queryRaw.mock.calls[1]
    expect(countSql.join('')).toContain('COUNT(*)')
    expect(pageSql.join('')).toContain(
      'ORDER BY verification_request.created_at DESC, verification_request.id DESC',
    )
    expect(pageSql.join('')).toContain("COALESCE(club.category, '') AS category")
    expect(pageFrom).toBe(countFrom)
    expect(countFrom.sql).toContain('club.deleted_at IS NULL')
    expect(countFrom.sql).toContain('verification_request.status =')
    expect(countFrom.sql).toContain('club.affiliation_type !=')
    expect(countFrom.values).toEqual(['REJECTED', '소속동아리', '중앙동아리'])
    expect([offset, limit]).toEqual([20, 10])
    expect(result).toEqual({
      total_count: 12,
      requests: [
        {
          id: 42,
          club_uuid: clubUuid,
          club_name: '동아리',
          category: '학술',
          status: 'REJECTED',
          reject_reason: '서류 부족',
          created_at: '2026-10-01T00:00:00.000Z',
        },
      ],
    })
  })

  it('returns the count for an empty page without filters', async () => {
    prisma.$queryRaw.mockReset()
    prisma.$queryRaw.mockResolvedValueOnce([{ total_count: BigInt(3) }]).mockResolvedValueOnce([])

    const result = await new AdminClubService().getAdminClubVerificationRequests({
      offset: 100,
      limit: 20,
    })

    const from = prisma.$queryRaw.mock.calls[0][1]
    expect(from.sql).not.toContain('WHERE')
    expect(from.values).toEqual([])
    expect(result).toEqual({ total_count: 3, requests: [] })
  })
})
