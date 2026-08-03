import type { OfficialVerificationStatus } from "@/entities/club";
import { getApiErrorStatus } from "@/shared/utils/apiError";

type OfficialVerificationButtonStateParams = {
	status?: OfficialVerificationStatus;
	isStatusLoading: boolean;
	isRequesting?: boolean;
};

type OfficialVerificationButtonState = {
	label: string;
	disabled: boolean;
};

export const getOfficialVerificationButtonState = ({
	status,
	isStatusLoading,
	isRequesting = false,
}: OfficialVerificationButtonStateParams): OfficialVerificationButtonState => {
	if (isRequesting) {
		return {
			label: "총동연 공식 인증 신청 중...",
			disabled: true,
		};
	}

	if (isStatusLoading) {
		return {
			label: "인증 상태 확인 중...",
			disabled: true,
		};
	}

	if (status === "PENDING") {
		return {
			label: "총동연 공식 인증 심사 중",
			disabled: true,
		};
	}

	if (status === "VERIFIED") {
		return {
			label: "총동연 공식 인증 완료",
			disabled: true,
		};
	}

	return {
		label: "총동연 공식 인증 신청하기",
		disabled: false,
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
	return (status && ERROR_CONTENT_BY_STATUS[status]) || DEFAULT_ERROR_CONTENT;
};
