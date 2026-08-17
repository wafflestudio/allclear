/**
 * 앱 딥링크(allclear://...)를 시도하고,
 * 일정 시간 안에 앱으로 전환되지 않으면 앱 다운로드 페이지로 폴백한다.
 */
export function openAppDeepLink(deepPath = '') {
  const fallback = setTimeout(() => {
    window.location.href = '/download/app'
  }, 1500)

  // 앱으로 전환되어 페이지가 숨겨지면 폴백을 취소한다
  const cancelOnHide = () => {
    if (document.hidden) clearTimeout(fallback)
  }
  document.addEventListener('visibilitychange', cancelOnHide, { once: true })

  window.location.href = `allclear://${deepPath}`
}

export function openClubInApp(uuid: string) {
  openAppDeepLink(`club/${uuid}`)
}
