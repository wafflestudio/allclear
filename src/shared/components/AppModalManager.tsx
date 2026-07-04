import AnnouncementModal from '@/shared/components/AnnouncementModal'
import TermsAgreementModal from '@/shared/components/TermsAgreementModal'
import useAnnouncementModals from '@/shared/hooks/useAnnouncementModals'
import usePendingTerms from '@/shared/hooks/usePendingTerms'

/**
 * 약관 동의 / 공지 모달을 화면과 무관하게 전역에서 표시한다.
 * 로그인 위치(어느 탭/시점)와 관계없이, 조건이 충족되면 현재 화면 위에 모달이 뜬다.
 * 약관 동의가 필요하면 약관 모달을 우선 표시하고, 그렇지 않으면 공지 모달을 표시한다.
 */
const AppModalManager = () => {
	const { currentAnnouncement, handleCloseAnnouncement, handleHideAnnouncement } =
		useAnnouncementModals()
	const { pendingTerms, isSubmitting, shouldShowTermsModal, handleAgreeTerms } = usePendingTerms()

	if (shouldShowTermsModal === true) {
		return (
			<TermsAgreementModal
				visible
				terms={pendingTerms}
				isSubmitting={isSubmitting}
				onAgree={termUuids => handleAgreeTerms({ termUuids })}
			/>
		)
	}

	if (shouldShowTermsModal === false && currentAnnouncement) {
		return (
			<AnnouncementModal
				visible
				announcementUuid={currentAnnouncement.uuid}
				title={currentAnnouncement.title}
				description={currentAnnouncement.description}
				onHide={handleHideAnnouncement}
				onClose={handleCloseAnnouncement}
			/>
		)
	}

	return null
}

export default AppModalManager
