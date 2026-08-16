/**
 * 모바일 웹 → 앱 연결에 필요한 순수 로직.
 * DOM에 의존하지 않아 단위 테스트가 가능하다. (실제 이동은 openInApp.ts가 담당)
 */

export type MobilePlatform = 'ios' | 'android'

/** iOS Info.plist / AndroidManifest에 등록된 커스텀 스킴 */
export const APP_SCHEME = 'allclear'

/** 스토어 URL은 이 페이지가 플랫폼에 맞게 골라준다 (pages/download/app.tsx) */
export const APP_DOWNLOAD_PATH = '/download/app'

/**
 * 데스크톱 브라우저에는 배너를 띄우지 않으므로 모바일 OS만 구분한다.
 * iPadOS 13+ Safari는 기본 UA가 데스크톱(Macintosh)이라 여기서 걸리지 않고,
 * 모바일 UA를 보내는 구형 iPad만 ios로 잡힌다.
 */
export function detectMobilePlatform(userAgent: string): MobilePlatform | null {
  const ua = userAgent.toLowerCase()
  if (ua.includes('android')) {
    return 'android'
  }
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
    return 'ios'
  }
  return null
}

/** '/club/{uuid}?tab=1#a' → '/club/{uuid}' */
export function toPathname(url: string): string {
  return url.split(/[?#]/)[0]
}

const CLUB_DETAIL_PATHNAME =
  /^\/club\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:\/|$)/i

/**
 * 웹 경로를 앱 딥링크 경로로 변환한다.
 * 앱이 딥링크로 받는 화면은 동아리 상세뿐이라(apps/mobile/src/config/linking.ts),
 * 나머지는 빈 문자열 = 앱 첫 화면으로 보낸다.
 */
export function toAppDeepPath(pathname: string): string {
  const matched = CLUB_DETAIL_PATHNAME.exec(pathname)
  return matched ? `club/${matched[1]}` : ''
}

/** allclear://club/{uuid} */
export function buildSchemeUrl(deepPath: string): string {
  return `${APP_SCHEME}://${deepPath}`
}

/**
 * 안드로이드 크롬 계열은 intent:// 를 쓰면 앱 미설치 시 브라우저가
 * browser_fallback_url로 알아서 이동시켜 준다 (타이머 폴백보다 정확하다).
 * package를 지정하지 않아야 debug/release 빌드 모두 스킴으로 매칭된다.
 */
export function buildAndroidIntentUrl(deepPath: string, fallbackUrl: string): string {
  return `intent://${deepPath}#Intent;scheme=${APP_SCHEME};S.browser_fallback_url=${encodeURIComponent(
    fallbackUrl,
  )};end`
}

/**
 * 앱 설치 배너를 띄울 경로인지 판단한다.
 * 앱과 화면이 대응되는 /club 하위만 대상이고,
 * 로그인 콜백(리다이렉트 처리 중)과 앱 웹뷰 전용 페이지(/terms 등)는 제외한다.
 */
export function isAppBannerPath(pathname: string): boolean {
  if (pathname.startsWith('/club/auth')) {
    return false
  }
  return pathname === '/club' || pathname.startsWith('/club/')
}
