import { LRUCache } from 'lru-cache'
import type { ClubSearchIntent } from 'server/http/schemas/clubs'
import { decideSearchFilters } from './search-filter-intent'
import { rewriteSearchQuery } from './search-query-intent'

const cache = new LRUCache<string, Promise<ClubSearchIntent>>({ max: 500, ttl: 86_400_000 })

export async function interpretSearchQuery(query: string): Promise<ClubSearchIntent> {
  const text = query.trim().replace(/\s+/g, ' ')
  if (!text.includes(' ')) return { searchQuery: text, filters: {} }

  const cached = cache.get(text)
  if (cached) return cached

  const pending = buildIntent(text)
  cache.set(text, pending)
  return pending
}

async function buildIntent(query: string): Promise<ClubSearchIntent> {
  const signal = AbortSignal.timeout(3_000)
  let failed = false

  // 확정한 필터만 검색문에서 빼야 사용자의 조건이 사라지지 않습니다.
  const filters = await decideSearchFilters(query, signal).catch(() => {
    failed = true
    console.error('search filters unavailable')
    return {}
  })

  const searchQuery = await rewriteSearchQuery(query, filters, signal).catch(() => {
    failed = true
    console.error('search query rewriting unavailable')
    return query
  })

  if (failed || signal.aborted) cache.delete(query)
  return { searchQuery, filters }
}
