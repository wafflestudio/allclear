// 앱 shared/utils/api.ts(APIConnector) 대응 — 웹은 same-origin /api/v2 를 fetch 로 부른다.
import { getGuestId } from 'src/club/auth/guestId'
import { authHeaders } from 'src/club/auth/token'

/** 앱 apiConnector 인터셉터와 동일: 로그인 시 Bearer 토큰, 비로그인 시 x-guest-id */
export function identityHeaders(): Record<string, string> {
  const auth = authHeaders()
  return Object.keys(auth).length > 0 ? auth : { 'x-guest-id': getGuestId() }
}

export async function fetchJson<T>(url: string, headers?: Record<string, string>): Promise<T> {
  const res = await fetch(url, { headers })
  if (!res.ok) {
    throw new Error(`${url} failed: ${res.status}`)
  }
  return res.json()
}
