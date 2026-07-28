import {
	ENTRY_SPLASH_HOLD_MS,
	ENTRY_SPLASH_TRANSITION_MS,
	getEntrySplashStages,
} from '@/shared/utils/entrySplash'

describe('entry splash timeline', () => {
	it('keeps unauthenticated users on the fourth stage with login actions', () => {
		expect(getEntrySplashStages(false)).toEqual([1, 2, 3, 4])
	})

	it('finishes after the brand reveal for authenticated users', () => {
		expect(getEntrySplashStages(true)).toEqual([1, 2, 3])
	})

	it('uses the Figma prototype hold and transition durations', () => {
		expect(ENTRY_SPLASH_HOLD_MS).toBe(800)
		expect(ENTRY_SPLASH_TRANSITION_MS).toBe(300)
	})
})
