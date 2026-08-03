import { initialFormData } from "./types";

describe("club registration form fields", () => {
	it("collects up to three SNS URLs starting with one input", () => {
		expect(initialFormData).toHaveProperty("clubSNSUrls", [""]);
		expect(initialFormData).not.toHaveProperty("clubSNS");
	});

	it("does not collect founded date or active member count", () => {
		expect(initialFormData).not.toHaveProperty("foundedAt");
		expect(initialFormData).not.toHaveProperty("activeMemberCount");
	});

	it("continues to collect optional activity images", () => {
		expect(initialFormData).toHaveProperty("activityImages", []);
	});
});
