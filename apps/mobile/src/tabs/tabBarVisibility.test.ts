import { SCREEN_TYPE } from "@/shared/constants/screen";
import { shouldHideTabBar } from "@/tabs/tabBarVisibility";

describe("shouldHideTabBar", () => {
	it.each([SCREEN_TYPE.WEBVIEW, SCREEN_TYPE.MANAGE_CLUB_REGISTRATION])(
		"hides the tab bar on %s",
		(routeName) => {
			expect(shouldHideTabBar(routeName)).toBe(true);
		},
	);

	it.each([undefined, SCREEN_TYPE.MYPAGE, SCREEN_TYPE.EDIT_PROFILE])(
		"uses the normal tab bar on %s",
		(routeName) => {
			expect(shouldHideTabBar(routeName)).toBe(false);
		},
	);
});
