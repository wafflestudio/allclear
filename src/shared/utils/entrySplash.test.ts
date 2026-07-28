import {
	APP_INITIALIZATION_LOADING_DELAY_MS,
	ENTRY_SPLASH_HOLD_MS,
	ENTRY_SPLASH_TRANSITION_MS,
	getEntrySplashStages,
	shouldShowAppInitializationLoading,
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

	it('waits two seconds before showing the app initialization screen', () => {
		expect(APP_INITIALIZATION_LOADING_DELAY_MS).toBe(2000)
		expect(
			shouldShowAppInitializationLoading({
				delayElapsed: false,
				isProfileLoading: true,
				isUpdateCheckReady: false,
			}),
		).toBe(false)
	})

	it('shows the initialization screen only while startup work remains after the delay', () => {
		expect(
			shouldShowAppInitializationLoading({
				delayElapsed: true,
				isProfileLoading: false,
				isUpdateCheckReady: false,
			}),
		).toBe(true)
		expect(
			shouldShowAppInitializationLoading({
				delayElapsed: true,
				isProfileLoading: true,
				isUpdateCheckReady: true,
			}),
		).toBe(true)
		expect(
			shouldShowAppInitializationLoading({
				delayElapsed: true,
				isProfileLoading: false,
				isUpdateCheckReady: true,
			}),
		).toBe(false)
	})
})
