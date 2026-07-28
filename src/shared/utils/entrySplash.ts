export const APP_INITIALIZATION_LOADING_DELAY_MS = 2000
export const ENTRY_SPLASH_DESIGN_HEIGHT = 874
export const ENTRY_SPLASH_DESIGN_WIDTH = 402
export const ENTRY_SPLASH_HOLD_MS = 800
export const ENTRY_SPLASH_TRANSITION_MS = 300

export type EntrySplashStage = 1 | 2 | 3 | 4

export const getEntrySplashStages = (isAuthenticated: boolean): EntrySplashStage[] =>
	isAuthenticated ? [1, 2, 3] : [1, 2, 3, 4]

type EntrySplashViewportParams = {
	width: number
	height: number
	topInset: number
	bottomInset: number
}

export const getEntrySplashViewport = ({
	width,
	height,
	topInset,
	bottomInset,
}: EntrySplashViewportParams) => ({
	contentTop: topInset,
	contentBottom: bottomInset,
	scaleX: width / ENTRY_SPLASH_DESIGN_WIDTH,
	scaleY: Math.max(height - topInset - bottomInset, 1) / ENTRY_SPLASH_DESIGN_HEIGHT,
})

export const shouldShowGlobalAppModals = (entryPresentationReady: boolean): boolean =>
	entryPresentationReady

type AppInitializationLoadingParams = {
	delayElapsed: boolean
	isProfileLoading: boolean
	isUpdateCheckReady: boolean
}

export const shouldShowAppInitializationLoading = ({
	delayElapsed,
	isProfileLoading,
	isUpdateCheckReady,
}: AppInitializationLoadingParams): boolean =>
	delayElapsed && (isProfileLoading || !isUpdateCheckReady)
