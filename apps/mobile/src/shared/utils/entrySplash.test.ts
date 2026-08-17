import {
	APP_INITIALIZATION_LOADING_DELAY_MS,
	ENTRY_SPLASH_HOLD_MS,
	ENTRY_SPLASH_SYMBOL_SIZE,
	ENTRY_SPLASH_TRANSITION_MS,
	getCenteredScaledAssetOrigin,
	getEntrySplashStages,
	getEntrySplashViewport,
	resolveEntrySplashLayoutMetrics,
	shouldExitEntrySplash,
	shouldShowAppInitializationLoading,
	shouldShowGlobalAppModals,
} from "@/shared/utils/entrySplash";

describe("entry splash timeline", () => {
	it("keeps unauthenticated users on the fourth stage with login actions", () => {
		expect(getEntrySplashStages(false)).toEqual([1, 2, 3, 4]);
	});

	it("finishes after the brand reveal for authenticated users", () => {
		expect(getEntrySplashStages(true)).toEqual([1, 2, 3]);
	});

	it("uses the Figma prototype hold and transition durations", () => {
		expect(ENTRY_SPLASH_HOLD_MS).toBe(800);
		expect(ENTRY_SPLASH_TRANSITION_MS).toBe(300);
	});

	it("excludes the Android system bars from the entry layout viewport", () => {
		expect(
			getEntrySplashViewport({
				width: 402,
				height: 874,
				topInset: 24,
				bottomInset: 48,
			}),
		).toEqual({
			contentTop: 24,
			contentBottom: 48,
			scaleX: 1,
			scaleY: 802 / 874,
		});
	});

	it("keeps the iOS entry layout inside the Dynamic Island and home indicator", () => {
		const viewport = getEntrySplashViewport({
			width: 402,
			height: 874,
			topInset: 59,
			bottomInset: 34,
		});

		expect(viewport).toEqual({
			contentTop: 59,
			contentBottom: 34,
			scaleX: 1,
			scaleY: 781 / 874,
		});

		const wordmarkBottom =
			viewport.contentTop + (779 + 29.294) * viewport.scaleY;
		expect(wordmarkBottom).toBeLessThanOrEqual(874 - viewport.contentBottom);
	});

	it("keeps the first native layout when Android system bar metrics update", () => {
		const initialMetrics = {
			width: 402,
			height: 802,
			topInset: 24,
			bottomInset: 48,
		};
		const updatedMetrics = {
			width: 402,
			height: 874,
			topInset: 24,
			bottomInset: 48,
		};
		const lockedMetrics = resolveEntrySplashLayoutMetrics(null, initialMetrics);

		expect(resolveEntrySplashLayoutMetrics(lockedMetrics, updatedMetrics)).toBe(
			initialMetrics,
		);
	});

	it("renders the app symbol at 81px while preserving its scaled center", () => {
		expect(ENTRY_SPLASH_SYMBOL_SIZE).toBe(81);
		expect(
			getCenteredScaledAssetOrigin({
				designOrigin: 160.556,
				designSize: 80.906,
				renderedSize: ENTRY_SPLASH_SYMBOL_SIZE,
				scale: 360 / 402,
			}),
		).toBeCloseTo(((160.556 + 80.906 / 2) * 360) / 402 - 81 / 2);
	});

	it("keeps unauthenticated users on the login screen until they choose guest entry", () => {
		expect(
			shouldExitEntrySplash({
				isAuthenticated: false,
				guestEntryRequested: false,
			}),
		).toBe(false);
		expect(
			shouldExitEntrySplash({
				isAuthenticated: false,
				guestEntryRequested: true,
			}),
		).toBe(true);
	});

	it("exits the entry screen automatically for authenticated users", () => {
		expect(
			shouldExitEntrySplash({
				isAuthenticated: true,
				guestEntryRequested: false,
			}),
		).toBe(true);
	});

	it("shows global app modals only after the entry flow has completed", () => {
		expect(shouldShowGlobalAppModals({ entryFlowComplete: false })).toBe(false);
		expect(shouldShowGlobalAppModals({ entryFlowComplete: true })).toBe(true);
	});

	it("waits two seconds before showing the app initialization screen", () => {
		expect(APP_INITIALIZATION_LOADING_DELAY_MS).toBe(2000);
		expect(
			shouldShowAppInitializationLoading({
				delayElapsed: false,
				isProfileLoading: true,
				isUpdateCheckReady: false,
			}),
		).toBe(false);
	});

	it("shows the initialization screen only while startup work remains after the delay", () => {
		expect(
			shouldShowAppInitializationLoading({
				delayElapsed: true,
				isProfileLoading: false,
				isUpdateCheckReady: false,
			}),
		).toBe(true);
		expect(
			shouldShowAppInitializationLoading({
				delayElapsed: true,
				isProfileLoading: true,
				isUpdateCheckReady: true,
			}),
		).toBe(true);
		expect(
			shouldShowAppInitializationLoading({
				delayElapsed: true,
				isProfileLoading: false,
				isUpdateCheckReady: true,
			}),
		).toBe(false);
	});
});
