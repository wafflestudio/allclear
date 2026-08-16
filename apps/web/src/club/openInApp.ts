import {
  APP_DOWNLOAD_PATH,
  buildAndroidIntentUrl,
  buildSchemeUrl,
  detectMobilePlatform,
  toAppDeepPath,
  toPathname,
} from './appLink'

/** 앱 전환이 일어나지 않았다고 판단하기까지 기다리는 시간 */
const FALLBACK_DELAY_MS = 1500

/**
 * 앱 딥링크를 시도하고, 앱이 없으면 다운로드 페이지로 폴백한다.
 * - 안드로이드: intent:// 의 browser_fallback_url로 브라우저가 직접 폴백
 * - iOS: 커스텀 스킴을 열어보고 화면이 전환되지 않으면 타이머로 폴백
 * - 데스크톱: 시도할 앱이 없으므로 곧바로 다운로드 페이지로
 */
export function openAppDeepLink(deepPath = '') {
  const platform = detectMobilePlatform(navigator.userAgent)

  if (platform === null) {
    window.location.href = APP_DOWNLOAD_PATH
    return
  }

  if (platform === 'android') {
    window.location.href = buildAndroidIntentUrl(
      deepPath,
      `${window.location.origin}${APP_DOWNLOAD_PATH}`,
    )
    return
  }

  const fallback = setTimeout(() => {
    window.location.href = APP_DOWNLOAD_PATH
  }, FALLBACK_DELAY_MS)

  function cancelFallback() {
    clearTimeout(fallback)
    document.removeEventListener('visibilitychange', onVisibilityChange)
    window.removeEventListener('pagehide', cancelFallback)
  }

  // 앱으로 전환되면 페이지가 숨겨지거나(백그라운드) 언로드된다
  function onVisibilityChange() {
    if (document.hidden) {
      cancelFallback()
    }
  }

  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('pagehide', cancelFallback)

  window.location.href = buildSchemeUrl(deepPath)
}

export function openClubInApp(uuid: string) {
  openAppDeepLink(`club/${uuid}`)
}

/** 현재 보고 있는 웹 화면과 같은 화면을 앱에서 연다 */
export function openCurrentPageInApp(url: string) {
  openAppDeepLink(toAppDeepPath(toPathname(url)))
}
