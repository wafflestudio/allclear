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
const entrySplashScreen = readFileSync(
	resolve(mobileRoot, "src/shared/components/EntrySplashScreen.tsx"),
	"utf8",
);

describe("native splash startup", () => {
	it("keeps the iOS launch screen visible until the JS clone is ready", () => {
		expect(appDelegate).toContain("[RNSplashScreen show]");
		expect(entrySplashScreen).toContain(
			"onLayout={() => setSplashCloneLaidOut(true)}",
		);
		expect(entrySplashScreen).toContain(
			"onLoadEnd={() => setSplashCloneLoaded(true)}",
		);
		expect(entrySplashScreen).toContain("SplashScreen.hide()");
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
