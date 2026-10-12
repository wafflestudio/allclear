import {
	getAndroidEntrySplashOrigin,
	isAndroidEntrySplashReady,
} from "./androidEntrySplash";

describe("Android native-to-React splash handoff", () => {
	it("waits for both layout and all decoded brand assets", () => {
		const assets = [
			"symbol",
			"smallWordmark",
			"transitionWordmark",
			"wordmark",
		];
		expect(isAndroidEntrySplashReady(false, assets)).toBe(false);
		expect(isAndroidEntrySplashReady(true, assets.slice(1))).toBe(false);
		expect(isAndroidEntrySplashReady(true, assets)).toBe(true);
	});

	it("does not count duplicate image events as other loaded assets", () => {
		expect(isAndroidEntrySplashReady(true, Array(4).fill("symbol"))).toBe(
			false,
		);
	});

	it.each([
		[360, 800, 24],
		[412, 915, 43],
		[480, 960, 0],
	])(
		"centers the 81dp symbol in the native window at %s x %s",
		(width, height, topInset) => {
			const origin = getAndroidEntrySplashOrigin(width, height, topInset);
			expect(origin.left + 81 / 2).toBe(width / 2);
			expect(origin.top + topInset + 81 / 2).toBe(height / 2);
		},
	);
});
