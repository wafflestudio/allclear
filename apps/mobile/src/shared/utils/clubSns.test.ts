import { getClubSnsUrls, getSnsIcon, getSnsIconSize } from "./clubSns";

describe("club SNS presentation", () => {
	it("shows up to three SNS URLs from the new response field", () => {
		expect(
			getClubSnsUrls({
				snsUrls: [
					"https://instagram.com/club",
					"https://youtube.com/@club",
					"https://facebook.com/club",
					"https://x.com/club",
				],
			}),
		).toEqual([
			"https://instagram.com/club",
			"https://youtube.com/@club",
			"https://facebook.com/club",
		]);
	});

	it("returns an empty list when SNS URLs are absent", () => {
		expect(getClubSnsUrls({})).toEqual([]);
	});

	it("maps supported SNS domains to their icons", () => {
		expect(getSnsIcon("https://instagram.com/club")).toBe("instagram");
		expect(getSnsIcon("https://youtube.com/@club")).toBe("youtube");
		expect(getSnsIcon("https://facebook.com/club")).toBe("facebook");
		expect(getSnsIcon("https://x.com/club")).toBe("twitter");
		expect(getSnsIcon("https://example.com")).toBe("link-variant");
	});

	it("sizes SNS icons to match their proportions in the design", () => {
		expect(getSnsIconSize("https://instagram.com/club")).toBe(16);
		expect(getSnsIconSize("https://youtube.com/@club")).toBe(18);
		expect(getSnsIconSize("https://facebook.com/club")).toBe(16);
		expect(getSnsIconSize("https://x.com/club")).toBe(16);
		expect(getSnsIconSize("https://example.com")).toBe(18);
	});
});
