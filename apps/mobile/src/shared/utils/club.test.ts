import { getClubSummary, getClubSummaryWithAffiliation } from "./club";

describe("club summary presentation", () => {
	it("shows a summary without affiliation for carousel cards", () => {
		expect(
			getClubSummary({
				description: "기존 소개",
				shortDescription: "짧은 소개",
			}),
		).toBe("짧은 소개");
	});

	it("shows affiliation before the short description", () => {
		expect(
			getClubSummaryWithAffiliation({
				affiliationType: "소속동아리",
				collegeMajor: {
					id: 1,
					college: "공과대학",
					major: "컴퓨터공학부",
				},
				description: "기존 소개",
				shortDescription: "짧은 소개",
			}),
		).toBe("컴퓨터공학부 소속 짧은 소개");
	});

	it("shows the legacy description without affiliation when short description is absent", () => {
		expect(
			getClubSummaryWithAffiliation({
				affiliationType: "중앙동아리",
				collegeMajor: null,
				description: "기존 소개",
			}),
		).toBe("기존 소개");
	});

	it("shows only the short description when affiliation is 기타", () => {
		expect(
			getClubSummaryWithAffiliation({
				affiliationType: "기타",
				collegeMajor: null,
				description: "기존 소개",
				shortDescription: "짧은 소개",
			}),
		).toBe("짧은 소개");
	});
});
