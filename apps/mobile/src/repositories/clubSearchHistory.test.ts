import { getClubRepository } from "@/repositories/club";
import { apiConnector } from "@/shared/utils/api";

jest.mock("@/shared/utils/api", () => ({
	apiConnector: { get: jest.fn() },
}));

const get = apiConnector.get as jest.MockedFunction<typeof apiConnector.get>;

describe("club search history request", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it.each(["true", "false"] as const)(
		"forwards the explicit history preference %s without changing search filters",
		async (flag) => {
			const response = { clubs: [], totalSize: 0 };
			get.mockResolvedValue(response);
			const signal = new AbortController().signal;
			const result = await getClubRepository().searchClubs(
				{
					query: "  WAFFLE  ",
					record_recent_search: flag,
					affiliation_type: "중앙동아리",
				},
				signal,
			);
			const [path, params, passedSignal] = get.mock.calls[0];
			expect(path).toBe("/v2/clubs/search");
			expect(params).toBeInstanceOf(URLSearchParams);
			expect((params as URLSearchParams).get("query")).toBe("waffle");
			expect((params as URLSearchParams).get("affiliation_type")).toBe(
				"중앙동아리",
			);
			expect((params as URLSearchParams).get("record_recent_search")).toBe(
				flag,
			);
			expect(passedSignal).toBe(signal);
			expect(result).toBe(response);
		},
	);

	it("omits the preference for normal exploration searches", async () => {
		await getClubRepository().searchClubs({ query: "와플" });
		const params = get.mock.calls[0][1] as URLSearchParams;
		expect(params.has("record_recent_search")).toBe(false);
	});
});
