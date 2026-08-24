import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const repositoryRoot = resolve(__dirname, "../../../..");
const workflow = readFileSync(
	resolve(repositoryRoot, ".github/workflows/ios-dev-artifact.yml"),
	"utf8",
);
const exportOptions = readFileSync(
	resolve(repositoryRoot, ".github/ios/ExportOptions.dev.plist"),
	"utf8",
);

describe("iOS dev artifact workflow", () => {
	it("runs for develop updates and manual requests on a pinned macOS toolchain", () => {
		expect(workflow).toMatch(/push:\s+branches:\s+- develop/);
		expect(workflow).toContain("workflow_dispatch:");
		expect(workflow).toContain("runs-on: macos-15");
		expect(workflow).toContain(
			"/Applications/Xcode_16.4.app/Contents/Developer",
		);
	});

	it("builds the Local scheme as a registered-device IPA artifact", () => {
		expect(workflow).toContain("-scheme Local");
		expect(workflow).toContain("-configuration Local");
		expect(workflow).toContain("xcodebuild -exportArchive");
		expect(workflow).toContain("actions/upload-artifact@v4");
		expect(exportOptions).toContain("<string>debugging</string>");
		expect(exportOptions).toContain("<key>com.padocorp.clubhouse.dev</key>");
		expect(exportOptions).toContain("<string>allclear-dev</string>");
	});

	it("keeps signing material in environment secrets and cleans it up", () => {
		expect(workflow).toContain("environment: ios-dev-artifact");
		expect(workflow).toContain("secrets.IOS_DEV_CERTIFICATE_BASE64");
		expect(workflow).toContain("secrets.IOS_DEV_CERTIFICATE_PASSWORD");
		expect(workflow).toContain("secrets.IOS_DEV_PROVISIONING_PROFILE_BASE64");
		expect(workflow).toContain("secrets.IOS_ENV_LOCAL");
		expect(workflow).toContain("secrets.IOS_GOOGLE_SERVICE_INFO_PLIST_BASE64");
		expect(workflow).toMatch(/name: Cleanup signing material\s+if: always\(\)/);
	});

	it("fails closed when the certificate and profile do not describe the dev app", () => {
		expect(workflow).toContain("K9883YB4VR.com.padocorp.clubhouse.dev");
		expect(workflow).toContain("get-task-allow");
		expect(workflow).toContain("ProvisionedDevices:0");
		expect(workflow).toContain("DeveloperCertificates");
		expect(workflow).toContain(
			"Profile does not include the imported signing certificate",
		);
	});

	it("does not upload a development build to TestFlight", () => {
		expect(workflow).not.toContain("app-store-connect");
		expect(workflow).not.toContain("upload-testflight");
		expect(workflow).not.toContain("xcrun altool");
	});
});
