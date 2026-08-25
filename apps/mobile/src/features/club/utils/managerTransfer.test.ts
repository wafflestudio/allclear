import Clipboard from "@react-native-clipboard/clipboard";
import {
	canLoadManagerTransferInvitation,
	copyManagerTransferLink,
	getManagerTransferErrorAction,
	getManagerTransferErrorContent,
	MANAGER_TRANSFER_LINK_COPIED_DESCRIPTION,
} from "@/features/club/utils/managerTransfer";

jest.mock("axios", () => ({
	isAxiosError: (error: unknown) =>
		typeof error === "object" && error !== null && "response" in error,
}));

jest.mock("@react-native-clipboard/clipboard", () => ({
	__esModule: true,
	default: { setString: jest.fn() },
}));

describe("manager transfer UI helpers", () => {
	it("링크 복사 안내에 실제 개행을 사용한다", () => {
		expect(MANAGER_TRANSFER_LINK_COPIED_DESCRIPTION).toBe(
			"관리자 권한을 이전할 상대에게\n링크를 보내주세요",
		);
		expect(MANAGER_TRANSFER_LINK_COPIED_DESCRIPTION).not.toContain("\\n");
	});

	it("로그인과 전역 진입 절차가 끝난 뒤에만 초대 정보를 조회한다", () => {
		expect(canLoadManagerTransferInvitation(true, "settled")).toBe(true);
		expect(canLoadManagerTransferInvitation(false, "settled")).toBe(false);
		expect(canLoadManagerTransferInvitation(true, "resolving")).toBe(false);
		expect(canLoadManagerTransferInvitation(true, "presenting")).toBe(false);
	});

	it("권한 이전 링크를 클립보드에 복사한다", () => {
		const setString = jest.spyOn(Clipboard, "setString").mockImplementation();

		copyManagerTransferLink("https://all-clear.cc/manager-transfer/example");

		expect(setString).toHaveBeenCalledWith(
			"https://all-clear.cc/manager-transfer/example",
		);
	});

	it.each([
		[401, "로그인이 필요해요"],
		[403, "권한 이전 링크를 만들 수 없어요"],
		[404, "유효하지 않은 이전 링크예요"],
		[409, "본인에게는 권한을 이전할 수 없어요"],
	])("API 상태 %s에 맞는 안내를 반환한다", (status, title) => {
		expect(getManagerTransferErrorContent({ response: { status } }).title).toBe(
			title,
		);
	});

	it("알 수 없는 오류는 재시도 가능한 안내를 반환한다", () => {
		expect(getManagerTransferErrorContent(new Error("network"))).toEqual({
			title: "관리자 권한을 이전하지 못했어요",
			description: "네트워크 상태를 확인한 후 다시 시도해주세요",
		});
	});

	it.each([
		[401, "exit"],
		[403, "exit"],
		[404, "exit"],
		[409, "exit"],
		[500, "retry"],
	])("API 상태 %s에 맞는 후속 동작을 반환한다", (status, action) => {
		expect(getManagerTransferErrorAction({ response: { status } })).toBe(
			action,
		);
	});

	it("네트워크 오류는 재시도할 수 있다", () => {
		expect(getManagerTransferErrorAction(new Error("network"))).toBe("retry");
	});
});
