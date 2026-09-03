import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const mobileRoot = resolve(__dirname, "../..");
const appDelegate = readFileSync(
	resolve(mobileRoot, "ios/clubhouse/AppDelegate.mm"),
	"utf8",
);
const mainActivity = readFileSync(
	resolve(
		mobileRoot,
		"android/app/src/main/java/com/padocorp/clubhouse/MainActivity.kt",
	),
	"utf8",
);
const forceUpdateGate = readFileSync(
	resolve(mobileRoot, "src/shared/components/ForceUpdateGate.tsx"),
	"utf8",
);

describe("native splash startup", () => {
	it("does not block iOS launch with the legacy native splash loop", () => {
		expect(appDelegate).not.toContain("[RNSplashScreen show]");
	});

	it("does not cover the Android React entry flow with a legacy splash dialog", () => {
		expect(mainActivity).not.toContain("SplashScreen.show(this)");
		expect(forceUpdateGate).not.toContain('from "react-native-splash-screen"');
	});

	it("shows and activates the React entry screen immediately on both platforms", () => {
		expect(forceUpdateGate).toMatch(
			/!entryComplete && \([\s\S]*<EntrySplashScreen active/,
		);
	});
});
