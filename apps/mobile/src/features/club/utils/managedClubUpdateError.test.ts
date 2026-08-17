import { getManagedClubUpdateErrorContent } from "@/features/club/utils/managedClubUpdateError";

const createAxiosError = (status: number) => ({
	isAxiosError: true,
	response: { status },
});

describe("getManagedClubUpdateErrorContent", () => {
	it.each([
		[400, "입력한 내용을 확인해주세요"],
		[401, "로그인이 필요해요"],
		[403, "수정할 권한이 없어요"],
		[404, "신청 정보를 찾을 수 없어요"],
		[409, "운영진 정보를 수정할 수 없어요"],
	])("%i 응답에 맞는 오류를 반환한다", (status, title) => {
		expect(
			getManagedClubUpdateErrorContent(createAxiosError(status)).title,
		).toBe(title);
	});

	it("응답 상태를 알 수 없으면 재시도 안내를 반환한다", () => {
		expect(
			getManagedClubUpdateErrorContent(new Error("network error")),
		).toEqual({
			title: "신청 내용을 수정하지 못했어요",
			description: "네트워크 상태를 확인한 후 다시 시도해주세요",
		});
	});
});
