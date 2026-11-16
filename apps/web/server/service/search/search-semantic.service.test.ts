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

function findKeywords(topic: string) {
  return new SearchSemanticService().findKeywords(topic)
}

// DB가 뜻이 맞는다고 답할 꼴들
function fittingForms(...forms: string[]) {
  prisma.$queryRaw.mockResolvedValueOnce(forms.map((form) => ({ form })))
}

// DB에 물어본 꼴들
function askedForms(): string[] {
  const values = prisma.$queryRaw.mock.calls[0].slice(1)
  return values.find((value) => Array.isArray(value))
}

it('picks the words whose clubs are close to the topic', async () => {
  fittingForms('보드게임')

  await expect(findKeywords('보드게임 하는')).resolves.toEqual(['보드게임'])
})

it('tries a word without its particle, down to two characters', async () => {
  fittingForms('축구', '농구')

  await expect(findKeywords('축구나 농구면')).resolves.toEqual(['축구', '농구'])
  expect(askedForms()).toEqual(['축구나', '축구', '농구면', '농구'])
})

it('prefers the form with the least removed', async () => {
  fittingForms('보드', '보드게임')

  await expect(findKeywords('보드게임을')).resolves.toEqual(['보드게임'])
})

it('picks no keyword when the keyword query fails', async () => {
  prisma.$queryRaw.mockRejectedValueOnce(new Error('db down'))
  vi.spyOn(console, 'error').mockImplementationOnce(() => undefined)

  await expect(findKeywords('사진 찍는')).resolves.toEqual([])
})
