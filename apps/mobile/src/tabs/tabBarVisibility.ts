import { SCREEN_TYPE } from "@/shared/constants/screen";

export const shouldHideTabBar = (routeName?: string) =>
	routeName === SCREEN_TYPE.WEBVIEW ||
	routeName === SCREEN_TYPE.MANAGE_CLUB_REGISTRATION;
