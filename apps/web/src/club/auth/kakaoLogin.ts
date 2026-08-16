const LOGIN_NEXT_KEY = 'allclear-login-next'

/**
 * 카카오 OAuth 시작: 돌아올 경로를 저장하고 인가 페이지로 이동.
 * (앱 useLoginActions.onKakaoButtonPress 의 웹 대응 — 네이티브 SDK 대신 서버 OAuth 리다이렉트)
 * 완료 후 /api/v2/auth/kakao/callback → /club/auth/callback#token=... 으로 돌아온다.
 */
export function startKakaoLogin() {
  window.sessionStorage.setItem(LOGIN_NEXT_KEY, window.location.pathname + window.location.search)
  window.location.assign('/api/v2/auth/kakao?state=web')
}

export function consumeLoginNextPath(): string {
  const next = window.sessionStorage.getItem(LOGIN_NEXT_KEY)
  window.sessionStorage.removeItem(LOGIN_NEXT_KEY)
  return next || '/club'
}
