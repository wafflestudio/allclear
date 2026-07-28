export const ENTRY_SPLASH_HOLD_MS = 800
export const ENTRY_SPLASH_TRANSITION_MS = 300

export type EntrySplashStage = 1 | 2 | 3 | 4

export const getEntrySplashStages = (isAuthenticated: boolean): EntrySplashStage[] =>
	isAuthenticated ? [1, 2, 3] : [1, 2, 3, 4]
