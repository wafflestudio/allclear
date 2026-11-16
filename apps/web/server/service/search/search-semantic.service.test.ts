import { beforeEach, expect, it, vi } from 'vitest'

const { prisma } = vi.hoisted(() => ({
  prisma: {
    $queryRaw: vi.fn(),
    club: { findMany: vi.fn() },
    college_major: { findMany: vi.fn() },
  },
}))

vi.mock('server/provider', () => ({ Service: () => undefined }))
vi.mock('server/infra/database/prisma', () => ({ getPrismaClient: () => prisma }))
vi.mock('server/ENV', () => ({ ENV: { ELICE: { IS_CONFIGURED: true } } }))
vi.mock('server/infra/client/elice', () => ({
  EMBEDDING_VERSION: 'test-embedding',
  createEmbeddings: vi.fn().mockResolvedValue({ vectors: [[0.6, 0.8]] }),
}))

import { DEFAULT_MIN_SIMILARITY } from 'server/domain/constants/ai-search'
import { SearchSemanticService } from './search-semantic.service'

beforeEach(() => {
  vi.clearAllMocks()
  prisma.college_major.findMany.mockResolvedValue([])
  prisma.club.findMany.mockResolvedValue([])
  prisma.$queryRaw.mockResolvedValue([])

  // 후보가 하나 있어야 유사도 SQL까지 갑니다.
  prisma.club.findMany.mockResolvedValueOnce([{ uuid: 'club-1' }])
})

it.each([
  [undefined, DEFAULT_MIN_SIMILARITY],
  [0.35, 0.35],
])('applies min similarity %s as %s', async (given, applied) => {
  await new SearchSemanticService().search('개발', {}, given)

  const [sql, ...values] = prisma.$queryRaw.mock.calls[0]
  expect(sql.join('?')).toContain('1 - (embedding <=> ?::vector) >= ?')
  expect(values).toContain(applied)
})
