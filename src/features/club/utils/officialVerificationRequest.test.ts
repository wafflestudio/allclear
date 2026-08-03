import {
	getOfficialVerificationButtonState,
	getOfficialVerificationRequestErrorContent,
} from '@/features/club/utils/officialVerificationRequest'

const createAxiosError = (status: number) => ({
	isAxiosError: true,
	response: { status },
})

describe('getOfficialVerificationButtonState', () => {
	it('인증 상태를 확인하는 동안 신청할 수 없다', () => {
		expect(
			getOfficialVerificationButtonState({ status: undefined, isStatusLoading: true }),
		).toEqual({
			label: '인증 상태 확인 중...',
			disabled: true,
		})
	})

	it('미신청 동아리는 공식 인증을 신청할 수 있다', () => {
		expect(
			getOfficialVerificationButtonState({ status: 'UNVERIFIED', isStatusLoading: false }),
		).toEqual({
			label: '총동연 공식 인증 신청하기',
			disabled: false,
		})
	})

	it.each([
		['PENDING', '총동연 공식 인증 심사 중'],
		['VERIFIED', '총동연 공식 인증 완료'],
	] as const)('%s 상태에서는 중복 신청할 수 없다', (status, label) => {
		expect(getOfficialVerificationButtonState({ status, isStatusLoading: false })).toEqual({
			label,
			disabled: true,
		})
	})

	it('요청 전송 중에는 버튼을 비활성화한다', () => {
		expect(
			getOfficialVerificationButtonState({
				status: 'UNVERIFIED',
				isStatusLoading: false,
				isRequesting: true,
			}),
		).toEqual({
			label: '총동연 공식 인증 신청 중...',
			disabled: true,
		})
	})
})

describe('getOfficialVerificationRequestErrorContent', () => {
	it('409 응답은 이미 처리 중인 요청으로 안내한다', () => {
		expect(getOfficialVerificationRequestErrorContent(createAxiosError(409))).toEqual({
			title: '이미 공식 인증을 신청했어요',
			description: '현재 인증 상태를 다시 확인해주세요',
		})
	})

	it('응답 상태를 알 수 없으면 재시도를 안내한다', () => {
		expect(getOfficialVerificationRequestErrorContent(new Error('network error'))).toEqual({
			title: '공식 인증을 신청하지 못했어요',
			description: '네트워크 상태를 확인한 후 다시 시도해주세요',
		})
	})
})
