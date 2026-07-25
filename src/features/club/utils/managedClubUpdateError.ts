import { getApiErrorStatus } from '@/shared/utils/apiError'

export type ManagedClubUpdateErrorContent = {
	title: string
	description: string
}

const DEFAULT_ERROR_CONTENT: ManagedClubUpdateErrorContent = {
	title: '신청 내용을 수정하지 못했어요',
	description: '네트워크 상태를 확인한 후 다시 시도해주세요',
}

const ERROR_CONTENT_BY_STATUS: Partial<Record<number, ManagedClubUpdateErrorContent>> = {
	400: {
		title: '입력한 내용을 확인해주세요',
		description: '수정할 내용이 없거나 입력값의 형식이 올바르지 않아요',
	},
	401: {
		title: '로그인이 필요해요',
		description: '로그인 정보가 만료되었어요. 다시 로그인해주세요',
	},
	403: {
		title: '수정할 권한이 없어요',
		description: '본인의 신규 동아리 등록 신청만 수정할 수 있어요',
	},
	404: {
		title: '신청 정보를 찾을 수 없어요',
		description: '동아리 또는 운영진 정보가 존재하지 않아요',
	},
	409: {
		title: '운영진 정보를 수정할 수 없어요',
		description: '이미 승인된 동아리의 운영진 정보는 이 화면에서 수정할 수 없어요',
	},
}

export const getManagedClubUpdateErrorContent = (error: unknown): ManagedClubUpdateErrorContent => {
	const status = getApiErrorStatus(error)
	return (status && ERROR_CONTENT_BY_STATUS[status]) || DEFAULT_ERROR_CONTENT
}
