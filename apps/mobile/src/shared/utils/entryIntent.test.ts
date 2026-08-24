import type { AppModalFlowState } from "@/shared/utils/appModalFlow";
import {
	getNavigationInitialUrl,
	parsePendingEntryIntent,
	replacePendingEntryIntent,
	resolveExecutableEntryIntent,
} from "@/shared/utils/entryIntent";

const firstToken = "a".repeat(43);
const secondToken = "b".repeat(43);

describe("manager transfer entry intent", () => {
	it.each([
		`https://all-clear.cc/manager-transfer/${firstToken}`,
		`https://dev.all-clear.cc/manager-transfer/${firstToken}`,
		`allclear://manager-transfer/${firstToken}`,
	])("관리자 권한 이전 URL %s를 보류 진입 의도로 파싱한다", (url) => {
		expect(parsePendingEntryIntent(url)).toEqual({
			type: "MANAGER_TRANSFER",
			token: firstToken,
		});
		expect(getNavigationInitialUrl(url)).toBeNull();
	});

	it("일반 딥링크는 기존 네비게이션에 전달한다", () => {
		const url = "https://dev.all-clear.cc/club/example-club";

		expect(parsePendingEntryIntent(url)).toBeNull();
		expect(getNavigationInitialUrl(url)).toBe(url);
	});

	it.each([
		"https://example.com/manager-transfer/token",
		"allclear://manager-transfer/contains%2Fslash",
		"allclear://manager-transfer/",
	])("허용되지 않은 URL %s를 관리자 이전 의도로 취급하지 않는다", (url) => {
		expect(parsePendingEntryIntent(url)).toBeNull();
	});

	it("여러 링크를 받으면 마지막 링크만 유지한다", () => {
		const first = parsePendingEntryIntent(
			`allclear://manager-transfer/${firstToken}`,
		);
		const second = parsePendingEntryIntent(
			`allclear://manager-transfer/${secondToken}`,
		);

		expect(
			replacePendingEntryIntent(replacePendingEntryIntent(null, first), second),
		).toEqual(second);
	});

	it.each<AppModalFlowState>(["inactive", "resolving", "presenting"])(
		"전역 진입 절차가 %s이면 링크를 실행하지 않는다",
		(appModalFlowState) => {
			const pendingIntent = parsePendingEntryIntent(
				`allclear://manager-transfer/${firstToken}`,
			);

			expect(
				resolveExecutableEntryIntent({
					pendingIntent,
					isNavigationReady: true,
					appModalFlowState,
				}),
			).toBeNull();
		},
	);

	it("네비게이션과 전역 진입 절차가 모두 준비되면 링크를 실행한다", () => {
		const pendingIntent = parsePendingEntryIntent(
			`allclear://manager-transfer/${firstToken}`,
		);

		expect(
			resolveExecutableEntryIntent({
				pendingIntent,
				isNavigationReady: true,
				appModalFlowState: "settled",
			}),
		).toEqual(pendingIntent);
		expect(
			resolveExecutableEntryIntent({
				pendingIntent,
				isNavigationReady: false,
				appModalFlowState: "settled",
			}),
		).toBeNull();
		expect(
			resolveExecutableEntryIntent({
				pendingIntent: null,
				isNavigationReady: true,
				appModalFlowState: "settled",
			}),
		).toBeNull();
	});
});
