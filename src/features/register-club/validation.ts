// Backend requires `sns`/`image_uri` to satisfy `format: uri`. Users often type a
export const normalizeUrl = (raw: string): string => {
	const trimmed = raw.trim()
	if (!trimmed) {
		return ''
	}
	return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

const URL_PATTERN = /^https?:\/\/[^\s/$.?#].[^\s]*$/i

// Valid once normalized: requires an https host
export const isValidUrl = (raw: string): boolean => URL_PATTERN.test(normalizeUrl(raw))

// 01012345678 형식 (하이픈은 허용하되 제거 후 검사)
export const isValidPhoneNumber = (phone: string): boolean =>
	/^01[0-9]\d{8}$/.test(phone.replace(/-/g, ''))

// 2023-12345 형식
export const isValidStudentId = (studentId: string): boolean =>
	/^\d{4}-\d{5}$/.test(studentId.trim())
