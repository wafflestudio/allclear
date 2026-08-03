import {
	areValidSnsUrls,
	getSnsRequestFields,
	normalizeSnsUrls,
} from "./validation";

describe("SNS URL validation", () => {
	it("normalizes every SNS URL", () => {
		expect(
			normalizeSnsUrls(["instagram.com/club", " https://youtube.com/@club "]),
		).toEqual(["https://instagram.com/club", "https://youtube.com/@club"]);
	});

	it("accepts one to three valid SNS URLs", () => {
		expect(areValidSnsUrls(["instagram.com/club"])).toBe(true);
		expect(
			areValidSnsUrls([
				"instagram.com/club",
				"youtube.com/@club",
				"facebook.com/club",
			]),
		).toBe(true);
	});

	it("sends only the SNS URL list", () => {
		expect(
			getSnsRequestFields(["instagram.com/club", "youtube.com/@club"]),
		).toEqual({
			sns_urls: ["https://instagram.com/club", "https://youtube.com/@club"],
		});
	});

	it("rejects empty, invalid, or more than three SNS URLs", () => {
		expect(areValidSnsUrls([])).toBe(false);
		expect(areValidSnsUrls([""])).toBe(false);
		expect(areValidSnsUrls(["instagram.com/club", "invalid url"])).toBe(false);
		expect(
			areValidSnsUrls([
				"instagram.com/club",
				"youtube.com/@club",
				"facebook.com/club",
				"x.com/club",
			]),
		).toBe(false);
	});
});
