export {
	areValidSnsUrls,
	getSnsRequestFields,
	isValidUrl,
	MAX_CLUB_SNS_URLS,
	normalizeSnsUrls,
	normalizeUrl,
} from '@/shared/utils/clubSns'

// 01012345678 형식 (하이픈은 허용하되 제거 후 검사)
export const isValidPhoneNumber = (phone: string): boolean =>
	/^01[0-9]\d{8}$/.test(phone.replace(/-/g, ''))

// 2023-12345 형식
export const isValidStudentId = (studentId: string): boolean =>
	/^\d{4}-\d{5}$/.test(studentId.trim())
