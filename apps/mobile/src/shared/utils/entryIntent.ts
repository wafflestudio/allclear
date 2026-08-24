import type { AppModalFlowState } from "@/shared/utils/appModalFlow";

const MANAGER_TRANSFER_TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,256}$/;
const WEB_LINK_HOSTS = new Set(["all-clear.cc", "dev.all-clear.cc"]);

export type PendingEntryIntent = {
	type: "MANAGER_TRANSFER";
	token: string;
} | null;

export const parsePendingEntryIntent = (
	rawUrl: string | null,
): PendingEntryIntent => {
	if (!rawUrl) return null;

	try {
		const url = new URL(rawUrl);
		const isCustomScheme =
			url.protocol === "allclear:" && url.hostname === "manager-transfer";
		const isWebLink =
			url.protocol === "https:" && WEB_LINK_HOSTS.has(url.hostname);
		const encodedToken = isCustomScheme
			? url.pathname.match(/^\/([^/]+)\/?$/)?.[1]
			: isWebLink
				? url.pathname.match(/^\/manager-transfer\/([^/]+)\/?$/)?.[1]
				: undefined;

		if (!encodedToken) return null;

		const token = decodeURIComponent(encodedToken);
		return MANAGER_TRANSFER_TOKEN_PATTERN.test(token)
			? { type: "MANAGER_TRANSFER", token }
			: null;
	} catch {
		return null;
	}
};

export const getNavigationInitialUrl = (
	rawUrl: string | null,
): string | null => (parsePendingEntryIntent(rawUrl) ? null : rawUrl);

export const replacePendingEntryIntent = (
	_currentIntent: PendingEntryIntent,
	nextIntent: PendingEntryIntent,
): PendingEntryIntent => nextIntent;

type ResolveExecutableEntryIntentParams = {
	pendingIntent: PendingEntryIntent;
	isNavigationReady: boolean;
	appModalFlowState: AppModalFlowState;
};

export const resolveExecutableEntryIntent = ({
	pendingIntent,
	isNavigationReady,
	appModalFlowState,
}: ResolveExecutableEntryIntentParams): PendingEntryIntent =>
	pendingIntent && isNavigationReady && appModalFlowState === "settled"
		? pendingIntent
		: null;
