import type { ManagedClubListItem, UserNotification, UserNotificationType } from '../../api.mypage'

// 앱 MyPageScreen 의 USER_NOTIFICATION_CONTENT / getUserNotificationContent 등과 동일

export type UserNotificationModalContent = {
  title: string
  description: string
  buttonLabel: string
  hasCancel?: boolean
  cancelLabel?: string
}

const USER_NOTIFICATION_CONTENT: Record<UserNotificationType, UserNotificationModalContent> = {
  CLUB_REGISTRATION_APPROVED: {
    title: '동아리 등록 신청이 승인되었어요!',
    description: '이제 동아리 공고를 등록/수정하거나,\n동아리 정보를 수정할 수 있어요',
    buttonLabel: '확인',
  },
  CLUB_REGISTRATION_REJECTED: {
    title: '동아리 등록 신청이 반려되었어요',
    description: '',
    buttonLabel: '수정 및 재신청',
    hasCancel: true,
    cancelLabel: '취소',
  },
  MANAGER_REQUEST_APPROVED: {
    title: '운영진 등록 신청이 승인되었어요!',
    description: '이제 동아리 공고를 등록/수정하거나,\n동아리 정보를 수정할 수 있어요',
    buttonLabel: '확인',
  },
  MANAGER_REQUEST_REJECTED: {
    title: '운영진 등록 신청이 반려되었어요',
    description: '',
    buttonLabel: '수정 및 재신청',
    hasCancel: true,
    cancelLabel: '취소',
  },
}

export const getNotificationClub = (
  notification: UserNotification,
  manageClubs: ManagedClubListItem[],
) =>
  manageClubs.find(
    (club) =>
      club.uuid === notification.clubId ||
      club.id === notification.clubId ||
      club.uuid === notification.sourceId,
  )

const getNotificationRejectReason = (
  notification: UserNotification,
  manageClubs: ManagedClubListItem[],
) => {
  const trimmedMetadataRejectReason = notification.metadata?.rejectReason?.trim()

  if (trimmedMetadataRejectReason) {
    return trimmedMetadataRejectReason
  }

  if (notification.type !== 'CLUB_REGISTRATION_REJECTED') {
    return undefined
  }

  return getNotificationClub(notification, manageClubs)?.rejectReason?.trim() || undefined
}

export const getUserNotificationContent = (
  notification: UserNotification,
  manageClubs: ManagedClubListItem[],
): UserNotificationModalContent => {
  const content = USER_NOTIFICATION_CONTENT[notification.type]

  if (
    notification.type !== 'CLUB_REGISTRATION_REJECTED' &&
    notification.type !== 'MANAGER_REQUEST_REJECTED'
  ) {
    return content
  }

  const rejectReason = getNotificationRejectReason(notification, manageClubs)

  return {
    ...content,
    description: rejectReason ? `${rejectReason}` : '사유가 등록되지 않았어요',
  }
}
