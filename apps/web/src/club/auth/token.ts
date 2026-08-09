// 앱의 AsyncStorage LOGIN_TOKEN에 대응하는 웹 토큰 저장소
const LOGIN_TOKEN_KEY = 'allclear-login-token'

export function getLoginToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(LOGIN_TOKEN_KEY)
}

export function setLoginToken(token: string) {
  window.localStorage.setItem(LOGIN_TOKEN_KEY, token)
}

export function clearLoginToken() {
  window.localStorage.removeItem(LOGIN_TOKEN_KEY)
}

// 앱 apiConnector와 동일: Authorization + x-authorization 모두 첨부
export function authHeaders(): Record<string, string> {
  const token = getLoginToken()
  if (!token) return {}
  return {
    Authorization: `Bearer ${token}`,
    'x-authorization': `Bearer ${token}`,
  }
}

export class ApiError extends Error {
  status: number
  constructor(url: string, status: number) {
    super(`${url} failed: ${status}`)
    this.status = status
  }
}

export async function authFetch<T>(url: string, init?: Parameters<typeof fetch>[1]): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { ...authHeaders(), ...init?.headers },
  })
  if (!res.ok) {
    throw new ApiError(url, res.status)
  }
  if (res.status === 204) return undefined as T
  const text = await res.text()
  return text ? JSON.parse(text) : (undefined as T)
}
