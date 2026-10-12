import { ENTRY_SPLASH_SYMBOL_SIZE } from "./entrySplash";

const BRAND_ASSETS = [
	"symbol",
	"smallWordmark",
	"transitionWordmark",
	"wordmark",
];

export const isAndroidEntrySplashReady = (
	laidOut: boolean,
	settledAssets: string[],
) => laidOut && BRAND_ASSETS.every((asset) => settledAssets.includes(asset));

export const getAndroidEntrySplashOrigin = (
	width: number,
	height: number,
	topInset: number,
) => ({
	left: (width - ENTRY_SPLASH_SYMBOL_SIZE) / 2,
	top: (height - ENTRY_SPLASH_SYMBOL_SIZE) / 2 - topInset,
});
