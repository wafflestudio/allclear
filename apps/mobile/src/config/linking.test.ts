import { getStateFromPath } from "@react-navigation/native";
import {
	createAppLinking,
	createBufferedUrlSubscription,
	linking,
} from "@/config/linking";
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
		const urlEvents = createBufferedUrlSubscription();
		const onPendingEntryIntent = jest.fn();
		const navigationListener = jest.fn();
		const token = "b".repeat(43);
		const appLinking = createAppLinking({
			initialUrl: null,
			onPendingEntryIntent,
			subscribeToUrls: urlEvents.subscribe,
		});

		const unsubscribe = appLinking.subscribe?.(navigationListener);
		urlEvents.publish(`https://dev.all-clear.cc/manager-transfer/${token}`);
		urlEvents.publish("https://dev.all-clear.cc/club/example");
		unsubscribe?.();

		expect(onPendingEntryIntent).toHaveBeenCalledWith({
			type: "MANAGER_TRANSFER",
			token,
		});
		expect(navigationListener).toHaveBeenCalledWith(
			"https://dev.all-clear.cc/club/example",
		);
	});

	it("부트스트랩 중 관리자 이전과 일반 URL을 종류별 최신 1개씩 보존한다", () => {
		const urlEvents = createBufferedUrlSubscription();
		const listener = jest.fn();
		const firstToken = "c".repeat(43);
		const latestToken = "d".repeat(43);

		urlEvents.publish(
			`https://dev.all-clear.cc/manager-transfer/${firstToken}`,
		);
		urlEvents.publish("https://dev.all-clear.cc/club/first");
		urlEvents.publish(
			`https://dev.all-clear.cc/manager-transfer/${latestToken}`,
		);
		urlEvents.publish("https://dev.all-clear.cc/club/latest");
		expect(urlEvents.hasPublishedUrl()).toBe(true);

		const unsubscribe = urlEvents.subscribe(listener);
		expect(listener.mock.calls).toEqual([
			["https://dev.all-clear.cc/club/latest"],
			[`https://dev.all-clear.cc/manager-transfer/${latestToken}`],
		]);

		unsubscribe();
		urlEvents.publish("https://dev.all-clear.cc/club/after-unsubscribe");
		expect(listener).toHaveBeenCalledTimes(2);
	});
});
