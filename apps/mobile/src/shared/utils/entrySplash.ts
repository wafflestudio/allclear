export const APP_INITIALIZATION_LOADING_DELAY_MS = 2000;
// iOS launch-screen SplashImage의 1x 기준 캔버스와 일치시킨다.
// 네이티브 스플래시에서 React 진입 애니메이션으로 넘어갈 때 첫 프레임이
// 서로 다른 기준 해상도로 재배치되지 않도록 한다.
export const ENTRY_SPLASH_DESIGN_HEIGHT = 844;
export const ENTRY_SPLASH_DESIGN_WIDTH = 390;
export const ENTRY_SPLASH_HOLD_MS = 800;
export const ENTRY_SPLASH_SYMBOL_SIZE = 81;
export const ENTRY_SPLASH_TRANSITION_MS = 300;

export type EntrySplashStage = 1 | 2 | 3 | 4;

export const getEntrySplashStages = (
	isAuthenticated: boolean,
): EntrySplashStage[] => (isAuthenticated ? [1, 2, 3] : [1, 2, 3, 4]);

export type EntrySplashLayoutMetrics = {
	width: number;
	height: number;
	topInset: number;
	bottomInset: number;
};

export const resolveEntrySplashLayoutMetrics = (
	initialMetrics: EntrySplashLayoutMetrics | null,
	currentMetrics: EntrySplashLayoutMetrics,
): EntrySplashLayoutMetrics => initialMetrics ?? currentMetrics;

export const getEntrySplashViewport = ({
	width,
	height,
	topInset,
	bottomInset,
}: EntrySplashLayoutMetrics) => ({
	contentTop: topInset,
	contentBottom: bottomInset,
	// iOS launch storyboard는 390 x 844pt SplashImage를 화면 중앙에 고정한다.
	// JS 애니메이션의 첫 프레임도 이 offset을 써야 네이티브 화면과 이어진다.
	nativeSplashLeft: (width - ENTRY_SPLASH_DESIGN_WIDTH) / 2,
	nativeSplashTop: (height - ENTRY_SPLASH_DESIGN_HEIGHT) / 2,
	scaleX: width / ENTRY_SPLASH_DESIGN_WIDTH,
	scaleY:
		Math.max(height - topInset - bottomInset, 1) / ENTRY_SPLASH_DESIGN_HEIGHT,
});

type CenteredScaledAssetOriginParams = {
	designOrigin: number;
	designSize: number;
	renderedSize: number;
	scale: number;
};

export const getCenteredScaledAssetOrigin = ({
	designOrigin,
	designSize,
	renderedSize,
	scale,
}: CenteredScaledAssetOriginParams): number => {
	"worklet";

	return (designOrigin + designSize / 2) * scale - renderedSize / 2;
};

type EntrySplashExitParams = {
	isAuthenticated: boolean;
	guestEntryRequested: boolean;
};

export const shouldExitEntrySplash = ({
	isAuthenticated,
	guestEntryRequested,
}: EntrySplashExitParams): boolean => isAuthenticated || guestEntryRequested;

type CompleteAppEntryParams = {
	entrySplashComplete: boolean;
	isUpdateCheckReady: boolean;
	updateRequired: boolean;
};

export const shouldCompleteAppEntry = ({
	entrySplashComplete,
	isUpdateCheckReady,
	updateRequired,
}: CompleteAppEntryParams): boolean =>
	entrySplashComplete && isUpdateCheckReady && !updateRequired;

type AppInitializationLoadingParams = {
	delayElapsed: boolean;
	isProfileLoading: boolean;
	isUpdateCheckReady: boolean;
};

export const shouldShowAppInitializationLoading = ({
	delayElapsed,
	isProfileLoading,
	isUpdateCheckReady,
}: AppInitializationLoadingParams): boolean =>
	delayElapsed && (isProfileLoading || !isUpdateCheckReady);
