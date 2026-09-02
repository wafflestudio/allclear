import Clipboard from "@react-native-clipboard/clipboard";
import { getApiErrorStatus } from "@/shared/utils/apiError";
import type { AppModalFlowState } from "@/shared/utils/appModalFlow";

export type ManagerTransferErrorContent = {
	title: string;
	description: string;
};

const DEFAULT_ERROR_CONTENT: ManagerTransferErrorContent = {
	title: "관리자 권한을 이전하지 못했어요",
	description: "네트워크 상태를 확인한 후 다시 시도해주세요",
};

export const MANAGER_TRANSFER_LINK_COPIED_DESCRIPTION =
	"관리자 권한을 이전할 상대에게\n링크를 보내주세요";

export const getManagerTransferConfirmationContent = (clubName: string) => ({
	title: "관리자 권한을 이전받을까요?",
	description: `‘${clubName}’ 동아리의\n관리자 권한을 이전받을 수 있어요.`,
});

export const canLoadManagerTransferInvitation = (
	isAuthenticated: boolean,
	appModalFlowState: AppModalFlowState,
): boolean => isAuthenticated && appModalFlowState === "settled";

const ERROR_CONTENT_BY_STATUS: Partial<
	Record<number, ManagerTransferErrorContent>
> = {
	401: {
		title: "로그인이 필요해요",
		description: "로그인 정보가 만료되었어요. 다시 로그인해주세요",
	},
	403: {
		title: "권한 이전 링크를 만들 수 없어요",
		description: "현재 동아리 관리자만 이전 링크를 만들 수 있어요",
	},
	404: {
		title: "유효하지 않은 이전 링크예요",
		description: "링크가 만료되었거나 이미 사용되었어요",
	},
	409: {
		title: "본인에게는 권한을 이전할 수 없어요",
		description: "다른 올클 회원에게 링크를 전달해주세요",
	},
};

export const getManagerTransferErrorContent = (
	error: unknown,
): ManagerTransferErrorContent => {
	const status = getApiErrorStatus(error);
	return (status && ERROR_CONTENT_BY_STATUS[status]) || DEFAULT_ERROR_CONTENT;
};

export const getManagerTransferErrorAction = (
	error: unknown,
): "retry" | "exit" => {
	const status = getApiErrorStatus(error);
	return status == null || status >= 500 ? "retry" : "exit";
};

export const copyManagerTransferLink = (transferUrl: string): void => {
	Clipboard.setString(transferUrl);
};
