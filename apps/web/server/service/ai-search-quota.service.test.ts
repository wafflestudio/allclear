import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const prisma = vi.hoisted(() => ({
  $queryRaw: vi.fn(),
  $executeRaw: vi.fn(),
}))

vi.mock('server/provider', () => ({ Service: () => undefined }))
vi.mock('server/infra/database/prisma', () => ({ getPrismaClient: () => prisma }))

import { AI_SEARCH_DAILY_LIMIT } from 'server/domain/constants/ai-search'
import { TooManyRequestsError } from 'server/domain/error'
import { AiSearchQuotaService } from './ai-search-quota.service'

const ACCOUNT_ID = '123e4567-e89b-12d3-a456-426614174000'

// UTC로는 11월 16일이지만 KST로는 11월 17일 00:30입니다.
const KST_HALF_PAST_MIDNIGHT = new Date('2026-11-16T15:30:00Z')
const SECONDS_UNTIL_NEXT_KST_MIDNIGHT = 23.5 * 60 * 60

function consumeWhenCountBecomes(count: number) {
  prisma.$queryRaw.mockResolvedValue([{ count }])
  return new AiSearchQuotaService().consume(ACCOUNT_ID)
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(KST_HALF_PAST_MIDNIGHT)
  prisma.$executeRaw.mockResolvedValue(0)
})

afterEach(() => {
  vi.useRealTimers()
})

it('counts the use under the KST date', async () => {
  await consumeWhenCountBecomes(2)

  const [, today, accountId] = prisma.$queryRaw.mock.calls[0]
  expect(today).toBe('2026-11-17')
  expect(accountId).toBe(ACCOUNT_ID)
})

it('allows the use that reaches the limit', async () => {
  await expect(consumeWhenCountBecomes(AI_SEARCH_DAILY_LIMIT)).resolves.toBeUndefined()
})

it('rejects the use that exceeds the limit, until the next KST midnight', async () => {
  const rejection = await consumeWhenCountBecomes(AI_SEARCH_DAILY_LIMIT + 1).catch((error) => error)

  expect(rejection).toBeInstanceOf(TooManyRequestsError)
  expect(rejection.retryAfterSeconds).toBe(SECONDS_UNTIL_NEXT_KST_MIDNIGHT)
})

it('deletes rows of past dates on the first use of the day', async () => {
  await consumeWhenCountBecomes(1)

  const [, today] = prisma.$executeRaw.mock.calls[0]
  expect(today).toBe('2026-11-17')
})

it('does not delete on later uses', async () => {
  await consumeWhenCountBecomes(2)

  expect(prisma.$executeRaw).not.toHaveBeenCalled()
})
