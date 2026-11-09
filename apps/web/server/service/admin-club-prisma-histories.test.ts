import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prisma } = vi.hoisted(() => ({ prisma: { $queryRaw: vi.fn() } }))

vi.mock('../provider', () => ({
  InjectRepository: () => () => undefined,
  Service: () => undefined,
}))
vi.mock('../infra/database/prisma', () => ({ getPrismaClient: () => prisma }))

import { AdminClubService } from './admin-club.service'

const clubUuid = '123e4567-e89b-12d3-a456-426614174000'
const serviceUserId = '123e4567-e89b-12d3-a456-426614174001'
const history = {
  id: BigInt(42),
  club_uuid: clubUuid,
  club_name: '동아리',
  service_user_id: serviceUserId,
  updated_by_name: '담당자',
  changed_fields: ['name'],
  before_data: { name: '이전' },
  after_data: { name: '현재' },
  created_at: new Date('2026-10-01T00:00:00.000Z'),
}

beforeEach(() => {
  vi.resetAllMocks()
  prisma.$queryRaw
    .mockResolvedValueOnce([{ total_count: BigInt(12) }])
    .mockResolvedValueOnce([history])
})

describe('AdminClubService Prisma club histories', () => {
  it('filters both queries and preserves pagination and response mapping', async () => {
    const result = await new AdminClubService().getAdminClubHistories({
      club_uuid: clubUuid,
      query: '  홍길동  ',
      affiliation_type: '소속동아리',
      exclude_affiliation_type: '중앙동아리',
      offset: 20,
      limit: 10,
    })

    expect(prisma.$queryRaw).toHaveBeenCalledTimes(2)
    const [countSql, countFrom] = prisma.$queryRaw.mock.calls[0]
    const [pageSql, pageFrom, offset, limit] = prisma.$queryRaw.mock.calls[1]
    expect(countSql.join('')).toContain('COUNT(DISTINCT history.id)')
    expect(pageSql.join('')).toContain('ORDER BY history.created_at DESC, history.id DESC')
    expect(pageFrom).toBe(countFrom)
    expect(offset).toBe(20)
    expect(limit).toBe(10)
    expect(countFrom.sql).toContain('manager.deleted_at IS NULL')
    expect(countFrom.sql).toContain('club.affiliation_type !=')
    expect(countFrom.sql).toContain('club.name ILIKE')
    expect(countFrom.values).toEqual([
      clubUuid,
      '소속동아리',
      '중앙동아리',
      '%홍길동%',
      '%홍길동%',
      '%홍길동%',
    ])
    expect(result).toEqual({
      total_count: 12,
      histories: [
        {
          id: 42,
          club_uuid: clubUuid,
          club_name: '동아리',
          updated_by: { service_user_id: serviceUserId, name: '담당자' },
          changed_fields: ['name'],
          before_data: { name: '이전' },
          after_data: { name: '현재' },
          created_at: '2026-10-01T00:00:00.000Z',
        },
      ],
    })
  })

  it('skips empty search text and returns an empty page with the count', async () => {
    prisma.$queryRaw.mockReset()
    prisma.$queryRaw.mockResolvedValueOnce([{ total_count: BigInt(3) }]).mockResolvedValueOnce([])

    const result = await new AdminClubService().getAdminClubHistories({
      query: '   ',
      offset: 100,
      limit: 20,
    })

    const from = prisma.$queryRaw.mock.calls[0][1]
    expect(from.sql).not.toContain('WHERE')
    expect(from.values).toEqual([])
    expect(result).toEqual({ total_count: 3, histories: [] })
  })

  it('binds search text as a parameter', async () => {
    const query = "' OR TRUE --"
    await new AdminClubService().getAdminClubHistories({ query, offset: 0, limit: 10 })

    const from = prisma.$queryRaw.mock.calls[0][1]
    expect(from.sql).not.toContain(query)
    expect(from.values).toEqual([`%${query}%`, `%${query}%`, `%${query}%`])
  })
})
