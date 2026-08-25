export type AppModalFlowState =
	| "inactive"
	| "resolving"
	| "presenting"
	| "settled";

type ResolveAppModalFlowStateParams = {
	active: boolean;
	isLoginBottomSheetOpen: boolean;
	shouldShowTermsModal: boolean | null;
	hasResolvedAnnouncements: boolean;
	hasCurrentAnnouncement: boolean;
};

export const resolveAppModalFlowState = ({
	active,
	isLoginBottomSheetOpen,
	shouldShowTermsModal,
	hasResolvedAnnouncements,
	hasCurrentAnnouncement,
}: ResolveAppModalFlowStateParams): AppModalFlowState => {
	if (!active) return "inactive";
	if (isLoginBottomSheetOpen) return "presenting";
	if (shouldShowTermsModal === null) return "resolving";
	if (shouldShowTermsModal) return "presenting";
	if (!hasResolvedAnnouncements) return "resolving";
	if (hasCurrentAnnouncement) return "presenting";
	return "settled";
};

type ResolveShouldShowTermsModalParams = {
	enabled: boolean;
	isProfileLoading: boolean;
	isAuthenticated: boolean;
	isFetching: boolean;
	hasFetchedPendingTerms: boolean;
	hasPendingTermsError: boolean;
	pendingTermCount: number;
};

export const resolveShouldShowTermsModal = ({
	enabled,
	isProfileLoading,
	isAuthenticated,
	isFetching,
	hasFetchedPendingTerms,
	hasPendingTermsError,
	pendingTermCount,
}: ResolveShouldShowTermsModalParams): boolean | null => {
	if (!enabled || isProfileLoading) return null;
	if (!isAuthenticated) return false;
	if (isFetching) return null;
	if (hasPendingTermsError) return false;
	if (!hasFetchedPendingTerms) return null;
	return pendingTermCount > 0;
};
