import type { LinkingOptions } from "@react-navigation/native";
import { ENV } from "@/config/ENV";
import {
	type RootStackParamList,
	SCREEN_TYPE,
} from "@/shared/constants/screen";

export const linking: LinkingOptions<RootStackParamList> = {
	prefixes: [
		"allclear://",
		"https://all-clear.cc",
		"https://dev.all-clear.cc",
		ENV.WEB_URL,
	],
	config: {
		screens: {
			[SCREEN_TYPE.MANAGER_TRANSFER_ACCEPTANCE]: "manager-transfer/:token",
			Main: {
				screens: {
					홈: {
						screens: {
							[SCREEN_TYPE.CLUB_DETAIL]: "club/:uuid",
						},
					},
				},
			},
		},
	},
};
