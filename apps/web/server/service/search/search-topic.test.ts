import { beforeEach, expect, it, vi } from 'vitest'

const { queryRaw } = vi.hoisted(() => ({ queryRaw: vi.fn() }))

vi.mock('server/infra/database/prisma', () => ({
  getPrismaClient: () => ({ $queryRaw: queryRaw }),
}))

import { extractSearchTopic } from './search-topic'

// 동아리 글에 흔하다고 DB가 답할 꼴들
function commonForms(...forms: string[]) {
  queryRaw.mockResolvedValueOnce(forms.map((form) => ({ form })))
}

// DB에 물어본 꼴들
function askedForms(): string[] {
  const values = queryRaw.mock.calls[0].slice(1)
  return values.find((value) => Array.isArray(value))
}

beforeEach(() => {
  vi.clearAllMocks()
})

it('removes the words that are common across clubs', async () => {
  commonForms('동아리')

  await expect(extractSearchTopic('사진 찍는 동아리')).resolves.toBe('사진 찍는')
})

it('recognizes a common word with a particle or punctuation attached', async () => {
  commonForms('동아리')

  await expect(extractSearchTopic('동아리에서 밴드 하고 싶어요 동아리?')).resolves.toBe(
    '밴드 하고 싶어요',
  )
  expect(askedForms()).toEqual(expect.arrayContaining(['동아리에서', '동아리에', '동아리']))
})

it('does not shorten a word below three characters', async () => {
  commonForms()

  await expect(extractSearchTopic('동아시아 학회')).resolves.toBe('동아시아 학회')
  expect(askedForms()).toEqual(['동아시아', '동아시', '학회'])
})

it('keeps the query when every word is common', async () => {
  commonForms('서울대', '동아리')

  await expect(extractSearchTopic('  서울대   동아리 ')).resolves.toBe('서울대 동아리')
})
