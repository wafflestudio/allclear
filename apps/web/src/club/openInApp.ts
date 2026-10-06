type OpenAppDeepLinkOptions = {
  fallbackUrl?: string | null
  fallbackDelayMs?: number
}

export const buildAppDeepLinkUrl = (deepPath = '') => `allclear://${deepPath.replace(/^\/+/, '')}`

export function openAppDeepLink(
  deepPath = '',
  { fallbackUrl = '/download/app', fallbackDelayMs = 1500 }: OpenAppDeepLinkOptions = {},
) {
  const fallback = fallbackUrl
    ? setTimeout(() => {
        window.location.href = fallbackUrl
      }, fallbackDelayMs)
    : null

  const cancelOnHide = () => {
    if (document.hidden && fallback) clearTimeout(fallback)
  }
  if (fallback) document.addEventListener('visibilitychange', cancelOnHide, { once: true })

  window.location.href = buildAppDeepLinkUrl(deepPath)

  return () => {
    if (fallback) clearTimeout(fallback)
    document.removeEventListener('visibilitychange', cancelOnHide)
  }
}

export function openClubInApp(uuid: string) {
  openAppDeepLink(`club/${uuid}`)
}
