import { getStateFromPath } from "@react-navigation/native";
import { Linking } from "react-native";
import { createAppLinking, linking } from "@/config/linking";
import { SCREEN_TYPE } from "@/shared/constants/screen";

jest.mock("react-native-config", () => ({
	API_SERVER_BASE_URL: "https://dev.all-clear.cc/api",
	PROFILE: "dev",
	WEB_URL: "https://dev.all-clear.cc",
}));

describe("deep linking", () => {
	it("관리자 권한 이전 링크에서 토큰을 루트 수락 화면으로 전달한다", () => {
		const token = "a".repeat(43);

		expect(
			getStateFromPath(`/manager-transfer/${token}`, linking.config),
		).toMatchObject({
			routes: [
				{
					name: SCREEN_TYPE.MANAGER_TRANSFER_ACCEPTANCE,
					params: { token },
				},
			],
		});
	});

	it("실행 중 관리자 이전 링크는 보류하고 일반 링크만 네비게이션에 전달한다", () => {
		let urlHandler: ((event: { url: string }) => void) | undefined;
		const remove = jest.fn();
		jest
			.spyOn(Linking, "addEventListener")
			.mockImplementation((_eventType, handler) => {
				urlHandler = handler;
				return { remove } as unknown as ReturnType<
					typeof Linking.addEventListener
				>;
			});
		const onPendingEntryIntent = jest.fn();
		const navigationListener = jest.fn();
		const token = "b".repeat(43);
		const appLinking = createAppLinking({
			initialUrl: null,
			onPendingEntryIntent,
		});

		const unsubscribe = appLinking.subscribe?.(navigationListener);
		urlHandler?.({
			url: `https://dev.all-clear.cc/manager-transfer/${token}`,
		});
		urlHandler?.({ url: "https://dev.all-clear.cc/club/example" });
		unsubscribe?.();

		expect(onPendingEntryIntent).toHaveBeenCalledWith({
			type: "MANAGER_TRANSFER",
			token,
		});
		expect(navigationListener).toHaveBeenCalledWith(
			"https://dev.all-clear.cc/club/example",
		);
		expect(remove).toHaveBeenCalledTimes(1);
	});
});
