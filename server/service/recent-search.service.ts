import { getRequiredRedisClient } from 'server/infra/redis/client'
import { Provider } from 'server/provider'
import { assertNever } from 'server/util/assert-never'
import { OptionalAuth } from 'server/util/optional-auth'
import { UserService } from './user.service'

const RECENT_SEARCH_LIMIT = 8
const GUEST_RECENT_SEARCH_TTL_SECONDS = 60 * 60 * 24
const GUEST_RECENT_SEARCH_KEY_PREFIX = 'recent-searches:guest'

export type RecentSearch = {
  query: string
  searchedAt: string
}

export type GuestRecentSearchDebug = {
  key: string
  ttl: number
  raw: Array<{
    query: string
    searchedAt: string
  }>
  recentSearches: RecentSearch[]
}

export async function findMemberRecentSearches(accountId: string): Promise<RecentSearch[]> {
  const userService = Provider.getService(UserService)
  const user = await userService.getUserByAccountId(accountId)
  const recentSearches = await userService.findRecentSearches(user.serviceUserId)
  return recentSearches.map((it) => ({
    query: it.query,
    searchedAt: it.updatedAt,
  }))
}

export async function saveMemberRecentSearch(accountId: string, query: string): Promise<void> {
  const userService = Provider.getService(UserService)
  const user = await userService.getUserByAccountId(accountId)
  await userService.saveRecentSearch(user.serviceUserId, query)
}

export async function deleteMemberRecentSearches(accountId: string): Promise<void> {
  const userService = Provider.getService(UserService)
  const user = await userService.getUserByAccountId(accountId)
  await userService.deleteRecentSearches(user.serviceUserId)
}

export async function findGuestRecentSearches(guestId: string): Promise<RecentSearch[]> {
  const redis = await getRequiredRedisClient()
  const values = (await redis.sendCommand([
    'ZREVRANGE',
    guestRecentSearchKey(guestId),
    '0',
    String(RECENT_SEARCH_LIMIT - 1),
    'WITHSCORES',
  ])) as string[]

  const recentSearches: RecentSearch[] = []
  for (let index = 0; index < values.length; index += 2) {
    const query = values[index]
    const timestamp = Number(values[index + 1])
    if (!query || Number.isNaN(timestamp)) {
      continue
    }
    recentSearches.push({
      query,
      searchedAt: new Date(timestamp).toISOString(),
    })
  }
  return recentSearches
}

export async function saveGuestRecentSearch(guestId: string, query: string): Promise<void> {
  const normalizedQuery = query.trim()
  if (!normalizedQuery) {
    return
  }

  const redis = await getRequiredRedisClient()
  const key = guestRecentSearchKey(guestId)
  await redis.sendCommand(['ZADD', key, String(Date.now()), normalizedQuery])
  await redis.sendCommand(['ZREMRANGEBYRANK', key, '0', String(-(RECENT_SEARCH_LIMIT + 1))])
  await redis.sendCommand(['EXPIRE', key, String(GUEST_RECENT_SEARCH_TTL_SECONDS)])
}

export async function deleteGuestRecentSearches(guestId: string): Promise<void> {
  const redis = await getRequiredRedisClient()
  await redis.sendCommand(['DEL', guestRecentSearchKey(guestId)])
}

export async function findGuestRecentSearchDebug(guestId: string): Promise<GuestRecentSearchDebug> {
  const redis = await getRequiredRedisClient()
  const key = guestRecentSearchKey(guestId)
  const ttl = await redis.ttl(key)
  const values = (await redis.sendCommand(['ZREVRANGE', key, '0', '-1', 'WITHSCORES'])) as string[]
  const raw: GuestRecentSearchDebug['raw'] = []
  const recentSearches: RecentSearch[] = []

  for (let index = 0; index < values.length; index += 2) {
    const query = values[index]
    const timestamp = Number(values[index + 1])
    if (!query || Number.isNaN(timestamp)) {
      continue
    }
    const searchedAt = new Date(timestamp).toISOString()
    raw.push({
      query,
      searchedAt,
    })
    recentSearches.push({
      query,
      searchedAt,
    })
  }

  return {
    key,
    ttl,
    raw,
    recentSearches,
  }
}

export async function saveRecentSearchBestEffort(auth: OptionalAuth, query: string): Promise<void> {
  try {
    if (auth.type === 'member') {
      await saveMemberRecentSearch(auth.accountId, query)
      return
    }

    if (auth.type === 'guest') {
      await saveGuestRecentSearch(auth.guestId, query)
      return
    }

    assertNever(auth)
  } catch (err) {
    console.error('save recent search error: ', err)
  }
}

function guestRecentSearchKey(guestId: string): string {
  return `${GUEST_RECENT_SEARCH_KEY_PREFIX}:${guestId}`
}
