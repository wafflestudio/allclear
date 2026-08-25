export const APP_STORE_URL =
  'https://apps.apple.com/kr/app/%ED%81%B4%EB%9F%BD%ED%95%98%EC%9A%B0%EC%8A%A4-%EC%9A%B0%EB%A6%AC-%ED%95%99%EA%B5%90-%EB%AA%A8%EB%93%A0-%EB%8F%99%EC%95%84%EB%A6%AC/id6461214029'

export const GOOGLE_PLAY_URL =
  'https://play.google.com/store/apps/details?id=com.padocorp.clubhouse.applicationId'

export type MobilePlatform = 'ios' | 'android' | 'other'

export const detectMobilePlatform = (userAgent: string): MobilePlatform => {
  const normalizedUserAgent = userAgent.toLowerCase()
  if (normalizedUserAgent.includes('android')) return 'android'
  if (/iphone|ipad|ipod/.test(normalizedUserAgent)) return 'ios'
  return 'other'
}
