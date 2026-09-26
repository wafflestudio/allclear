import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import AnnouncementModal from "@/shared/components/AnnouncementModal";
import TermsAgreementModal from "@/shared/components/TermsAgreementModal";
import { useAppModalFlow } from "@/shared/contexts/appModalFlowContext";

const ANDROID_MODAL_DISMISS_DELAY_MS = 300;

type AnnouncementDismissal = "close" | "hide";

/**
 * 약관 동의 / 공지 모달을 화면과 무관하게 전역에서 표시한다.
 * 로그인 위치(어느 탭/시점)와 관계없이, 조건이 충족되면 현재 화면 위에 모달이 뜬다.
 * 약관 동의가 필요하면 약관 모달을 우선 표시하고, 그렇지 않으면 공지 모달을 표시한다.
 */
const AppModalManager = () => {
	const {
		isLoginBottomSheetOpen,
		currentAnnouncement,
		closeAnnouncement,
		hideAnnouncement,
		pendingTerms,
		isSubmittingTerms,
		shouldShowTermsModal,
		agreeTerms,
	} = useAppModalFlow();
	const [isAnnouncementVisible, setIsAnnouncementVisible] = useState(false);
	const currentAnnouncementUuid = currentAnnouncement?.uuid;
	const announcementDismissal = useRef<AnnouncementDismissal | null>(null);
	const androidDismissTimer = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);

	const finalizeAnnouncementDismissal = useCallback(() => {
		const dismissal = announcementDismissal.current;
		if (!dismissal) return;

		announcementDismissal.current = null;
		if (dismissal === "hide") {
			hideAnnouncement();
			return;
		}

		closeAnnouncement();
	}, [closeAnnouncement, hideAnnouncement]);

	const requestAnnouncementDismissal = useCallback(
		(dismissal: AnnouncementDismissal) => {
			if (announcementDismissal.current) return;

			announcementDismissal.current = dismissal;
			setIsAnnouncementVisible(false);

			// React Native's Modal onDismiss callback is implemented only on iOS.
			if (Platform.OS !== "ios") {
				androidDismissTimer.current = setTimeout(
					finalizeAnnouncementDismissal,
					ANDROID_MODAL_DISMISS_DELAY_MS,
				);
			}
		},
		[finalizeAnnouncementDismissal],
	);

	useEffect(() => {
		if (!currentAnnouncementUuid) {
			setIsAnnouncementVisible(false);
			return;
		}

		setIsAnnouncementVisible(true);
	}, [currentAnnouncementUuid]);

	useEffect(
		() => () => {
			if (androidDismissTimer.current) {
				clearTimeout(androidDismissTimer.current);
			}
		},
		[],
	);

	if (isLoginBottomSheetOpen) return null;

	if (shouldShowTermsModal === true) {
		return (
			<TermsAgreementModal
				visible
				terms={pendingTerms}
				isSubmitting={isSubmittingTerms}
				onAgree={agreeTerms}
			/>
		);
	}

	if (shouldShowTermsModal === false && currentAnnouncement) {
		return (
			<AnnouncementModal
				visible={isAnnouncementVisible}
				announcementUuid={currentAnnouncement.uuid}
				title={currentAnnouncement.title}
				description={currentAnnouncement.description}
				onHide={() => requestAnnouncementDismissal("hide")}
				onClose={() => requestAnnouncementDismissal("close")}
				onDismiss={finalizeAnnouncementDismissal}
			/>
		);
	}

	return null;
};

export default AppModalManager;
