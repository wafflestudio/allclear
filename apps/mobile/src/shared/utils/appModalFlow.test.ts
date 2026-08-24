import {
	resolveAppModalFlowState,
	resolveShouldShowTermsModal,
} from "@/shared/utils/appModalFlow";

describe("global app modal flow", () => {
	it("진입 절차가 시작되기 전에는 inactive이다", () => {
		expect(
			resolveAppModalFlowState({
				active: false,
				isLoginBottomSheetOpen: false,
				shouldShowTermsModal: false,
				hasResolvedAnnouncements: true,
				hasCurrentAnnouncement: false,
			}),
		).toBe("inactive");
	});

	it("로그인 바텀시트가 열려 있으면 다른 모달을 겹쳐 띄우지 않는다", () => {
		expect(
			resolveAppModalFlowState({
				active: true,
				isLoginBottomSheetOpen: true,
				shouldShowTermsModal: true,
				hasResolvedAnnouncements: true,
				hasCurrentAnnouncement: true,
			}),
		).toBe("presenting");
	});

	it.each([
		{ shouldShowTermsModal: null, hasResolvedAnnouncements: true },
		{ shouldShowTermsModal: false, hasResolvedAnnouncements: false },
	])("약관 또는 공지 조회 중에는 resolving이다", (state) => {
		expect(
			resolveAppModalFlowState({
				active: true,
				isLoginBottomSheetOpen: false,
				shouldShowTermsModal: state.shouldShowTermsModal,
				hasResolvedAnnouncements: state.hasResolvedAnnouncements,
				hasCurrentAnnouncement: false,
			}),
		).toBe("resolving");
	});

	it("필수 약관은 공지 조회보다 먼저 표시한다", () => {
		expect(
			resolveAppModalFlowState({
				active: true,
				isLoginBottomSheetOpen: false,
				shouldShowTermsModal: true,
				hasResolvedAnnouncements: false,
				hasCurrentAnnouncement: false,
			}),
		).toBe("presenting");
	});

	it.each([
		{ shouldShowTermsModal: true, hasCurrentAnnouncement: false },
		{ shouldShowTermsModal: false, hasCurrentAnnouncement: true },
	])("표시할 약관 또는 공지가 있으면 presenting이다", (state) => {
		expect(
			resolveAppModalFlowState({
				active: true,
				isLoginBottomSheetOpen: false,
				shouldShowTermsModal: state.shouldShowTermsModal,
				hasResolvedAnnouncements: true,
				hasCurrentAnnouncement: state.hasCurrentAnnouncement,
			}),
		).toBe("presenting");
	});

	it("조회가 끝나고 표시할 모달이 없으면 settled이다", () => {
		expect(
			resolveAppModalFlowState({
				active: true,
				isLoginBottomSheetOpen: false,
				shouldShowTermsModal: false,
				hasResolvedAnnouncements: true,
				hasCurrentAnnouncement: false,
			}),
		).toBe("settled");
	});
});

describe("pending terms modal", () => {
	it("게스트 로그인 직후 약관 재조회가 끝날 때까지 대기한다", () => {
		expect(
			resolveShouldShowTermsModal({
				enabled: true,
				isProfileLoading: false,
				isAuthenticated: true,
				isFetching: true,
				hasFetchedPendingTerms: true,
				hasPendingTermsError: false,
				pendingTermCount: 0,
			}),
		).toBeNull();
	});

	it("약관 조회 오류는 fail-open 처리한다", () => {
		expect(
			resolveShouldShowTermsModal({
				enabled: true,
				isProfileLoading: false,
				isAuthenticated: true,
				isFetching: false,
				hasFetchedPendingTerms: true,
				hasPendingTermsError: true,
				pendingTermCount: 0,
			}),
		).toBe(false);
	});

	it("조회된 미동의 약관이 있으면 모달을 표시한다", () => {
		expect(
			resolveShouldShowTermsModal({
				enabled: true,
				isProfileLoading: false,
				isAuthenticated: true,
				isFetching: false,
				hasFetchedPendingTerms: true,
				hasPendingTermsError: false,
				pendingTermCount: 1,
			}),
		).toBe(true);
	});
});
