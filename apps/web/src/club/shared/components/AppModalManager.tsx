import { useAnnouncementModals } from '../hooks/useAnnouncementModals'
import { usePendingTerms } from '../hooks/usePendingTerms'
import { AnnouncementModal } from './AnnouncementModal'
import { TermsAgreementModal } from './TermsAgreementModal'

type Props = {
  isLoggedIn: boolean
  isProfileLoading: boolean
}

/**
 * 앱 shared/components/AppModalManager 와 동일:
 * 약관 동의 / 공지 모달을 화면과 무관하게 전역에서 표시한다.
 * 약관 동의가 필요하면 약관 모달을 우선 표시하고, 그렇지 않으면 공지 모달을 표시한다.
 */
export function AppModalManager({ isLoggedIn, isProfileLoading }: Props) {
  const { currentAnnouncement, handleCloseAnnouncement, handleHideAnnouncement } =
    useAnnouncementModals()
  const { pendingTerms, isSubmitting, shouldShowTermsModal, handleAgreeTerms } = usePendingTerms({
    isLoggedIn,
    isProfileLoading,
  })

  if (shouldShowTermsModal === true) {
    return (
      <TermsAgreementModal
        terms={pendingTerms}
        isSubmitting={isSubmitting}
        onAgree={(termUuids) => handleAgreeTerms({ termUuids })}
      />
    )
  }

  if (shouldShowTermsModal === false && currentAnnouncement) {
    return (
      <AnnouncementModal
        key={currentAnnouncement.key}
        announcementUuid={currentAnnouncement.uuid}
        title={currentAnnouncement.title}
        description={currentAnnouncement.description}
        showHideOption={isLoggedIn}
        onHide={handleHideAnnouncement}
        onClose={handleCloseAnnouncement}
      />
    )
  }

  return null
}
