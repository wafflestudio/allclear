import type { MdiIconName } from '../icons'

// 앱 shared/utils/clubSns.ts 와 동일

type ClubSnsData = {
  snsUrls?: string[] | null
}

export const MAX_CLUB_SNS_URLS = 3

export const normalizeUrl = (raw: string): string => {
  const trimmed = raw.trim()
  if (!trimmed) {
    return ''
  }
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

export const getClubSnsUrls = ({ snsUrls }: ClubSnsData): string[] =>
  (snsUrls ?? [])
    .map((url) => url.trim())
    .filter(Boolean)
    .slice(0, MAX_CLUB_SNS_URLS)

// 앱은 MaterialCommunityIcons 이름(instagram/youtube/facebook/twitter/link-variant)을 반환한다.
export const getSnsIcon = (url: string): MdiIconName => {
  if (url.includes('instagram.com')) return 'instagram'
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  if (url.includes('facebook.com')) return 'facebook'
  if (url.includes('x.com') || url.includes('twitter.com')) return 'twitter'
  return 'linkVariant'
}

export const getSnsIconSize = (url: string): number => {
  const icon = getSnsIcon(url)
  return icon === 'youtube' || icon === 'linkVariant' ? 18 : 16
}
