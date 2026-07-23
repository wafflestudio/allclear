type ClubSnsData = {
	sns?: string | null
	snsUrls?: string[]
}

export const MAX_CLUB_SNS_URLS = 3

export const normalizeUrl = (raw: string): string => {
	const trimmed = raw.trim()
	if (!trimmed) {
		return ''
	}
	return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

const URL_PATTERN = /^https?:\/\/[^\s/$.?#].[^\s]*$/i

export const isValidUrl = (raw: string): boolean => URL_PATTERN.test(normalizeUrl(raw))

export const normalizeSnsUrls = (urls: string[]): string[] => urls.map(normalizeUrl)

export const areValidSnsUrls = (urls: string[]): boolean =>
	urls.length >= 1 && urls.length <= MAX_CLUB_SNS_URLS && urls.every(isValidUrl)

export const getSnsRequestFields = (urls: string[]): { sns: string; sns_urls: string[] } => {
	const snsUrls = normalizeSnsUrls(urls)
	return {
		sns: snsUrls[0] ?? '',
		sns_urls: snsUrls,
	}
}

export const getClubSnsUrls = ({ sns, snsUrls }: ClubSnsData): string[] => {
	const urls = snsUrls?.length ? snsUrls : sns ? [sns] : []
	return urls
		.map(url => url.trim())
		.filter(Boolean)
		.slice(0, MAX_CLUB_SNS_URLS)
}

export const getSnsIcon = (url: string): string => {
	if (url.includes('instagram.com')) return 'instagram'
	if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
	if (url.includes('facebook.com')) return 'facebook'
	if (url.includes('x.com') || url.includes('twitter.com')) return 'twitter'
	return 'link-variant'
}
