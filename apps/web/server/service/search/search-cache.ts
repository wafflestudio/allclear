import { LRUCache } from 'lru-cache'

const MAX_ENTRIES = 500
const ONE_DAY_MS = 24 * 60 * 60 * 1000

// 검색어별 외부 API 결과를 하루 동안 기억합니다.
// 같은 검색어의 동시 요청은 하나의 호출을 함께 기다리고, 실패한 호출은 기억하지 않습니다.
export class SearchCache<Value> {
  private readonly entries = new LRUCache<string, Promise<Value>>({
    max: MAX_ENTRIES,
    ttl: ONE_DAY_MS,
  })

  getOrLoad(query: string, load: () => Promise<Value>): Promise<Value> {
    const cached = this.entries.get(query)
    if (cached) {
      return cached
    }

    const pending = load()
    pending.catch(() => this.entries.delete(query))

    this.entries.set(query, pending)
    return pending
  }
}

// 앞뒤 공백을 지우고 이어진 공백을 하나로 줄입니다. 같은 검색어가 같은 캐시 키를 갖게 됩니다.
export function normalizeQuery(query: string): string {
  return query.trim().replace(/\s+/g, ' ')
}
