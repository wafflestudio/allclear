import type { LinkingOptions } from "@react-navigation/native";
import { ENV } from "@/config/ENV";
import {
	type RootStackParamList,
	SCREEN_TYPE,
} from "@/shared/constants/screen";
import {
	type PendingEntryIntent,
	parsePendingEntryIntent,
} from "@/shared/utils/entryIntent";

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

type CreateAppLinkingParams = {
	initialUrl: string | null;
	onPendingEntryIntent: (intent: NonNullable<PendingEntryIntent>) => void;
	subscribeToUrls: SubscribeToUrls;
};

type UrlListener = (url: string) => void;
export type SubscribeToUrls = (listener: UrlListener) => () => void;

export const createBufferedUrlSubscription = () => {
	let listener: UrlListener | null = null;
	let latestNavigationUrl: string | null = null;
	let latestManagerTransferUrl: string | null = null;
	let hasPublishedUrl = false;

	return {
		publish: (url: string) => {
			hasPublishedUrl = true;
			if (listener) {
				listener(url);
				return;
			}

			if (parsePendingEntryIntent(url)) {
				latestManagerTransferUrl = url;
			} else {
				latestNavigationUrl = url;
			}
		},
		subscribe: (nextListener: UrlListener) => {
			listener = nextListener;
			const pendingUrls = [latestNavigationUrl, latestManagerTransferUrl];
			latestNavigationUrl = null;
			latestManagerTransferUrl = null;
			for (const pendingUrl of pendingUrls) {
				if (pendingUrl) nextListener(pendingUrl);
			}

			return () => {
				if (listener === nextListener) listener = null;
			};
		},
		hasPublishedUrl: () => hasPublishedUrl,
	};
};

export const createAppLinking = ({
	initialUrl,
	onPendingEntryIntent,
	subscribeToUrls,
}: CreateAppLinkingParams): LinkingOptions<RootStackParamList> => ({
	...linking,
	getInitialURL: () => initialUrl,
	subscribe: (listener) =>
		subscribeToUrls((url) => {
			const pendingIntent = parsePendingEntryIntent(url);
			if (pendingIntent) {
				onPendingEntryIntent(pendingIntent);
				return;
			}

			listener(url);
		}),
});
