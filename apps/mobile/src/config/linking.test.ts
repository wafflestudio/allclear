import { getStateFromPath } from "@react-navigation/native";
import { linking } from "@/config/linking";
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
});
