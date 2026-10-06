import type React from "react";
import { createContext, useCallback, useContext, useMemo } from "react";
import type { Term } from "@/entities/term";
import { useLoginBottomSheet } from "@/shared/contexts/loginBottomSheetContext";
import useAnnouncementModals, {
	type HomeAnnouncementModalItem,
} from "@/shared/hooks/useAnnouncementModals";
import usePendingTerms from "@/shared/hooks/usePendingTerms";
import {
	type AppModalFlowState,
	resolveAppModalFlowState,
} from "@/shared/utils/appModalFlow";

type AppModalFlowContextValue = {
	state: AppModalFlowState;
	isLoginBottomSheetOpen: boolean;
	currentAnnouncement: HomeAnnouncementModalItem | undefined;
	pendingTerms: Term[];
	isSubmittingTerms: boolean;
	shouldShowTermsModal: boolean | null;
	agreeTerms: (termUuids: string[]) => void;
	closeAnnouncement: () => void;
	hideAnnouncement: () => void;
};

const AppModalFlowContext = createContext<AppModalFlowContextValue | null>(
	null,
);

export const useAppModalFlow = () => {
	const context = useContext(AppModalFlowContext);
	if (!context) throw new Error("AppModalFlowProvider 안에서 사용해야 합니다");
	return context;
};

type Props = {
	active: boolean;
	children: React.ReactNode;
};

export const AppModalFlowProvider = ({ active, children }: Props) => {
	const { isOpen: isLoginBottomSheetOpen } = useLoginBottomSheet();
	const {
		currentAnnouncement,
		hasResolvedAnnouncements,
		handleCloseAnnouncement,
		handleHideAnnouncement,
	} = useAnnouncementModals(active);
	const { pendingTerms, isSubmitting, shouldShowTermsModal, handleAgreeTerms } =
		usePendingTerms(active);
	const agreeTerms = useCallback(
		(termUuids: string[]) => handleAgreeTerms({ termUuids }),
		[handleAgreeTerms],
	);
	const state = resolveAppModalFlowState({
		active,
		isLoginBottomSheetOpen,
		shouldShowTermsModal,
		hasResolvedAnnouncements,
		hasCurrentAnnouncement: Boolean(currentAnnouncement),
	});
	const value = useMemo<AppModalFlowContextValue>(
		() => ({
			state,
			isLoginBottomSheetOpen,
			currentAnnouncement,
			pendingTerms,
			isSubmittingTerms: isSubmitting,
			shouldShowTermsModal,
			agreeTerms,
			closeAnnouncement: handleCloseAnnouncement,
			hideAnnouncement: handleHideAnnouncement,
		}),
		[
			agreeTerms,
			currentAnnouncement,
			handleCloseAnnouncement,
			handleHideAnnouncement,
			isLoginBottomSheetOpen,
			isSubmitting,
			pendingTerms,
			shouldShowTermsModal,
			state,
		],
	);

	return (
		<AppModalFlowContext.Provider value={value}>
			{children}
		</AppModalFlowContext.Provider>
	);
};
