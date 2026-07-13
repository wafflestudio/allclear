// 앱은 서버(/v2/users/me/recent-searches)에 저장하지만 로그인이 필요하다.
// 웹 익명 사용자용으로 localStorage에 동일한 UX를 제공한다.
const RECENT_SEARCHES_KEY = 'allclear-recent-searches'
const MAX_RECENT_SEARCHES = 10

export function getRecentSearches(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((it) => typeof it === 'string') : []
  } catch {
    return []
  }
}

export function addRecentSearch(query: string): string[] {
  const trimmed = query.trim()
  if (!trimmed) return getRecentSearches()
  const next = [trimmed, ...getRecentSearches().filter((it) => it !== trimmed)].slice(
    0,
    MAX_RECENT_SEARCHES,
  )
  window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next))
  return next
}

export function clearRecentSearches(): string[] {
  window.localStorage.removeItem(RECENT_SEARCHES_KEY)
  return []
}
