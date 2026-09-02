import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const mobileRoot = resolve(__dirname, "../..");
const appDelegate = readFileSync(
	resolve(mobileRoot, "ios/clubhouse/AppDelegate.mm"),
	"utf8",
);
const forceUpdateGate = readFileSync(
	resolve(mobileRoot, "src/shared/components/ForceUpdateGate.tsx"),
	"utf8",
);

describe("iOS splash startup", () => {
	it("does not block app launch with the legacy native splash loop", () => {
		expect(appDelegate).not.toContain("[RNSplashScreen show]");
	});

	it("hides the legacy native splash only on Android", () => {
		expect(forceUpdateGate).toMatch(
			/Platform\.OS === "android"[\s\S]*SplashScreen\.hide\(\)/,
		);
	});

	it("shows and activates the React entry screen immediately on iOS", () => {
		expect(forceUpdateGate).toContain('useState(Platform.OS === "ios")');
		expect(forceUpdateGate).toContain(
			'Platform.OS === "ios" || isInitializationReady',
		);
	});
});
