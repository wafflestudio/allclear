import type { OfficialVerificationStatus } from "@/entities/club";
import { getApiErrorStatus } from "@/shared/utils/apiError";

export type OfficialVerificationButtonVariant = "outline" | "status" | "final";

type OfficialVerificationButtonStateParams = {
	status?: OfficialVerificationStatus;
	isStatusLoading: boolean;
	isRequesting?: boolean;
	isRetryLimitReached?: boolean;
	isRetryLimitAcknowledged?: boolean;
};

type OfficialVerificationButtonState = {
	label: string;
	disabled: boolean;
	variant: OfficialVerificationButtonVariant;
};

export const getOfficialVerificationButtonState = ({
	status,
	isStatusLoading,
	isRequesting = false,
	isRetryLimitReached = false,
	isRetryLimitAcknowledged = false,
}: OfficialVerificationButtonStateParams): OfficialVerificationButtonState => {
	if (isRequesting) {
		return {
			label: "올클 공식인증 요청 중...",
			disabled: true,
			variant: "status",
		};
	}

	if (isStatusLoading) {
		return {
			label: "인증 상태 확인 중...",
			disabled: true,
			variant: "status",
		};
	}

	if (status === "PENDING") {
		return {
			label: "올클 공식인증 심사중",
			disabled: true,
			variant: "status",
		};
	}

	if (status === "VERIFIED") {
		return {
			label: "올클 공식인증완료",
			disabled: true,
			variant: "status",
		};
	}

	if (status === "REJECTED") {
		if (isRetryLimitReached) {
			return {
				label: isRetryLimitAcknowledged
					? "올클 공식인증 반려"
					: "올클 공식인증 반려 및 재요청",
				disabled: isRetryLimitAcknowledged,
				variant: isRetryLimitAcknowledged ? "final" : "outline",
			};
		}

		return {
			label: "올클 공식인증 반려 및 재요청",
			disabled: false,
			variant: "outline",
		};
	}

	return {
		label: "올클 공식인증 요청하기",
		disabled: false,
		variant: "outline",
	};
};

export type OfficialVerificationRequestErrorContent = {
	title: string;
	description: string;
};

const DEFAULT_ERROR_CONTENT: OfficialVerificationRequestErrorContent = {
	title: "공식 인증을 신청하지 못했어요",
	description: "네트워크 상태를 확인한 후 다시 시도해주세요",
};

const RETRY_LIMIT_EXCEEDED_ERROR_MESSAGE =
	"official verification retry limit exceeded";

const ERROR_CONTENT_BY_STATUS: Partial<
	Record<number, OfficialVerificationRequestErrorContent>
> = {
	401: {
		title: "로그인이 필요해요",
		description: "로그인 정보가 만료되었어요. 다시 로그인해주세요",
	},
	403: {
		title: "공식 인증을 신청할 권한이 없어요",
		description: "등록된 동아리 운영진만 신청할 수 있어요",
	},
	404: {
		title: "동아리 정보를 찾을 수 없어요",
		description: "동아리 정보를 다시 확인해주세요",
	},
	409: {
		title: "이미 공식 인증을 신청했어요",
		description: "현재 인증 상태를 다시 확인해주세요",
	},
};

export const getOfficialVerificationRequestErrorContent = (
	error: unknown,
): OfficialVerificationRequestErrorContent => {
	const status = getApiErrorStatus(error);
	if (status === 409 && isRetryLimitExceeded(error)) {
		return {
			title: "재요청 횟수를 모두 사용했어요",
			description: "총동연 공식 인증은 더 이상 재요청할 수 없어요",
		};
	}

	return (status && ERROR_CONTENT_BY_STATUS[status]) || DEFAULT_ERROR_CONTENT;
};

const isRetryLimitExceeded = (error: unknown): boolean => {
	if (typeof error !== "object" || error === null) return false;

	const response = (error as { response?: { data?: unknown } }).response;
	return response?.data === RETRY_LIMIT_EXCEEDED_ERROR_MESSAGE;
};
