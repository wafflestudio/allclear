import {
	getOfficialVerificationButtonState,
	getOfficialVerificationRequestErrorContent,
} from "@/features/club/utils/officialVerificationRequest";

const createAxiosError = (status: number) => ({
	isAxiosError: true,
	response: { status },
});

const createRetryLimitExceededAxiosError = () => ({
	isAxiosError: true,
	response: {
		status: 409,
		data: "official verification retry limit exceeded",
	},
});

describe("getOfficialVerificationButtonState", () => {
	it("인증 상태를 확인하는 동안 신청할 수 없다", () => {
		expect(
			getOfficialVerificationButtonState({
				status: undefined,
				isStatusLoading: true,
			}),
		).toEqual({
			label: "인증 상태 확인 중...",
			disabled: true,
			variant: "status",
		});
	});

	it("미신청 동아리는 공식 인증을 신청할 수 있다", () => {
		expect(
			getOfficialVerificationButtonState({
				status: "UNVERIFIED",
				isStatusLoading: false,
			}),
		).toEqual({
			label: "올클 공식인증 요청하기",
			disabled: false,
			variant: "outline",
		});
	});

	it.each([
		["PENDING", "올클 공식인증 심사중"],
		["VERIFIED", "올클 공식인증완료"],
	] as const)("%s 상태에서는 중복 신청할 수 없다", (status, label) => {
		expect(
			getOfficialVerificationButtonState({ status, isStatusLoading: false }),
		).toEqual({
			label,
			disabled: true,
			variant: "status",
		});
	});

	it("요청 전송 중에는 버튼을 비활성화한다", () => {
		expect(
			getOfficialVerificationButtonState({
				status: "UNVERIFIED",
				isStatusLoading: false,
				isRequesting: true,
			}),
		).toEqual({
			label: "올클 공식인증 요청 중...",
			disabled: true,
			variant: "status",
		});
	});

	it("반려된 동아리는 인증을 재요청할 수 있다", () => {
		expect(
			getOfficialVerificationButtonState({
				status: "REJECTED",
				isStatusLoading: false,
			}),
		).toEqual({
			label: "올클 공식인증 반려 및 재요청",
			disabled: false,
			variant: "outline",
		});
	});

	it("재요청 횟수 소진 안내를 확인하면 버튼을 비활성화한다", () => {
		expect(
			getOfficialVerificationButtonState({
				status: "REJECTED",
				isStatusLoading: false,
				isRetryLimitReached: true,
				isRetryLimitAcknowledged: true,
			}),
		).toEqual({
			label: "올클 공식인증 반려",
			disabled: true,
			variant: "final",
		});
	});
});

describe("getOfficialVerificationRequestErrorContent", () => {
	it("409 응답은 이미 처리 중인 요청으로 안내한다", () => {
		expect(
			getOfficialVerificationRequestErrorContent(createAxiosError(409)),
		).toEqual({
			title: "이미 공식 인증을 신청했어요",
			description: "현재 인증 상태를 다시 확인해주세요",
		});
	});

	it("재요청 횟수 초과 응답은 재요청 불가로 안내한다", () => {
		expect(
			getOfficialVerificationRequestErrorContent(
				createRetryLimitExceededAxiosError(),
			),
		).toEqual({
			title: "재요청 횟수를 모두 사용했어요",
			description: "총동연 공식 인증은 더 이상 재요청할 수 없어요",
		});
	});

	it("응답 상태를 알 수 없으면 재시도를 안내한다", () => {
		expect(
			getOfficialVerificationRequestErrorContent(new Error("network error")),
		).toEqual({
			title: "공식 인증을 신청하지 못했어요",
			description: "네트워크 상태를 확인한 후 다시 시도해주세요",
		});
	});
});
