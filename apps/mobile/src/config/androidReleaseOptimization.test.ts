import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const appDirectory = resolve(__dirname, "../../android/app");
const gradle = readFileSync(resolve(appDirectory, "build.gradle"), "utf8");
const rules = readFileSync(resolve(appDirectory, "proguard-rules.pro"), "utf8");
const buildTypes = gradle.slice(gradle.indexOf("\n    buildTypes {"));
const releaseIndex = buildTypes.indexOf("\n        release {");
const devReleaseIndex = buildTypes.indexOf("\n        devRelease {");
const release = buildTypes.slice(releaseIndex, devReleaseIndex);
const resourceKeepPath = resolve(
	appDirectory,
	"src/main/res/raw/keep_com_padocorp_clubhouse.xml",
);

describe("Android release optimization", () => {
	it("enables R8 and resource shrinking with the optimizing default rules", () => {
		expect(release).toMatch(/minifyEnabled\s+true/);
		expect(release).toMatch(/shrinkResources\s+true/);
		expect(release).toMatch(
			/proguardFiles\s+getDefaultProguardFile\('proguard-android-optimize\.txt'\),\s*['"]proguard-rules\.pro['"]/,
		);
	});

	it("configures release before devRelease copies its optimized settings", () => {
		expect(releaseIndex).toBeLessThan(devReleaseIndex);
		expect(buildTypes.slice(devReleaseIndex)).toMatch(
			/devRelease\s*\{\s*initWith release/,
		);
		expect(buildTypes.slice(devReleaseIndex)).toContain(
			"signingConfig signingConfigs.debug",
		);
	});

	it("preserves the actual BuildConfig class used by react-native-config", () => {
		const namespace = gradle.match(/namespace "([^"]+)"/)?.[1];
		expect(namespace).toBe("com.padocorp.clubhouse");
		expect(rules).toContain(`-keep class ${namespace}.BuildConfig { *; }`);
		expect(rules).not.toContain("com.mypackage.BuildConfig");
	});

	it("retains the RN 0.77 inspector classes registered by merged native libraries", () => {
		expect(rules).toContain(
			"-keep class com.facebook.react.devsupport.CxxInspectorPackagerConnection* { *; }",
		);
	});

	it("retains Kakao model fields and Gson adapters without disabling R8 globally", () => {
		expect(rules).toContain(
			"-keep class com.kakao.sdk.**.model.* { <fields>; }",
		);
		expect(rules).toContain(
			"-keep class * extends com.google.gson.TypeAdapter",
		);
		expect(rules).not.toMatch(
			/^\s*-(dontobfuscate|dontoptimize|dontshrink|ignorewarnings)\b/m,
		);
	});

	it("keeps the strings that native config and Kakao load by name", () => {
		expect(existsSync(resourceKeepPath)).toBe(true);
		if (!existsSync(resourceKeepPath)) return;
		const resourceKeep = readFileSync(resourceKeepPath, "utf8");
		expect(resourceKeep).toContain("tools:keep=");
		expect(resourceKeep).toContain("@string/build_config_package");
		expect(resourceKeep).toContain("@string/kakao_app_key");
	});
});
