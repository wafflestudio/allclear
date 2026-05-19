import { z } from 'src/lib/schemas/zod'
import { RecentSearchSchema } from './users'

export const TestLoginSchema = z
  .object({
    username: z.string().trim().min(1).max(64),
    nickname: z.string().trim().min(1).max(32).optional(),
    name: z.string().trim().min(1).max(32).optional(),
    email: z.string().trim().email().max(80).optional(),
  })
  .openapi('TestLogin')

export const TestLoginResponseSchema = z
  .object({
    token: z.string(),
    accountId: z.string().uuid(),
    userId: z.string().uuid(),
    serviceUserId: z.string().uuid(),
    username: z.string(),
  })
  .openapi('TestLoginResponse')

export const TestGuestRecentSearchDebugQuerySchema = z
  .object({
    guestId: z.string().uuid(),
  })
  .openapi('TestGuestRecentSearchDebugQuery')

export const TestGuestRecentSearchDebugResponseSchema = z
  .object({
    key: z.string(),
    ttl: z.number().int(),
    raw: z.array(
      z.object({
        query: z.string(),
        searchedAt: z.string(),
      }),
    ),
    recentSearches: z.array(RecentSearchSchema),
  })
  .openapi('TestGuestRecentSearchDebugResponse')
