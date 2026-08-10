import {
	formatRecruitmentDeadline,
	formatRegularMeeting,
	getNextExpandedRecruitmentId,
	getRecruitmentApplicationRequestFields,
	getRecruitmentApplicationUrl,
	getRecruitmentDeadlineFormFields,
	getRecruitmentDeadlineRequestValue,
	getRecruitmentTextPreview,
	shouldStackActivityLocation,
	shouldStackRegularMeetings,
} from "./recruitmentPresentation";

describe("recruitment presentation rules", () => {
	it("formats recruitment deadlines as a short Korean date with the closed label", () => {
		expect(formatRecruitmentDeadline("2026-07-24T09:30:00.000Z")).toBe(
			"26.07.24 모집마감",
		);
		expect(formatRecruitmentDeadline("2027-01-05T00:05:00.000Z")).toBe(
			"27.01.05 모집마감",
		);
	});

	it("converts a Korean deadline input to UTC for the request", () => {
		expect(
			getRecruitmentDeadlineRequestValue({
				year: "2026",
				month: "07",
				day: "24",
				hour: "18",
				minute: "30",
			}),
		).toBe("2026-07-24T09:30:00.000Z");
	});

	it("converts a stored UTC deadline back to Korean form fields", () => {
		expect(
			getRecruitmentDeadlineFormFields("2026-07-24T09:30:00.000Z"),
		).toEqual({
			year: "2026",
			month: "07",
			day: "24",
			hour: "18",
			minute: "30",
		});
	});

	it("keeps zero or one regular meeting beside the yes/no row", () => {
		expect(shouldStackRegularMeetings(0)).toBe(false);
		expect(shouldStackRegularMeetings(1)).toBe(false);
	});

	it("stacks two or more regular meetings below the yes/no row", () => {
		expect(shouldStackRegularMeetings(2)).toBe(true);
		expect(shouldStackRegularMeetings(3)).toBe(true);
	});

	it("keeps a nine-character activity location beside its type", () => {
		expect(shouldStackActivityLocation("123456789")).toBe(false);
	});

	it("stacks a ten-character activity location below its type", () => {
		expect(shouldStackActivityLocation("1234567890")).toBe(true);
	});

	it("formats a meeting without exposing empty time separators", () => {
		expect(
			formatRegularMeeting({
				day_of_week: "금",
				start_time: "09:00:00",
				end_time: "11:00:00",
			}),
		).toBe("금요일 9:00~11:00");
		expect(
			formatRegularMeeting({
				day_of_week: "토",
				start_time: null,
				end_time: null,
			}),
		).toBe("토요일");
	});

	it("converts recruitment HTML into compact preview text", () => {
		expect(
			getRecruitmentTextPreview(
				"<p>서울대학교 <strong>와플 스튜디오</strong></p><p>두 번째&nbsp;문장 &amp; 안내</p>",
			),
		).toBe("서울대학교 와플 스튜디오 두 번째 문장 & 안내");
	});

	it("opens one previous recruitment at a time and toggles it closed", () => {
		expect(getNextExpandedRecruitmentId(null, 10)).toBe(10);
		expect(getNextExpandedRecruitmentId(10, 20)).toBe(20);
		expect(getNextExpandedRecruitmentId(20, 20)).toBeNull();
	});

	it("normalizes an application link before opening it", () => {
		expect(getRecruitmentApplicationUrl("instagram.com/club")).toBe(
			"https://instagram.com/club",
		);
		expect(getRecruitmentApplicationUrl("https://example.com/apply")).toBe(
			"https://example.com/apply",
		);
	});

	it("normalizes an application link before sending it", () => {
		expect(
			getRecruitmentApplicationRequestFields("forms.example.com/apply"),
		).toEqual({
			application_url: "https://forms.example.com/apply",
		});
		expect(
			getRecruitmentApplicationRequestFields("https://forms.example.com/apply"),
		).toEqual({
			application_url: "https://forms.example.com/apply",
		});
	});
});
