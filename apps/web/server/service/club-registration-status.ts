import type { ClubStatus } from 'src/common/constants/club-status'

type ClubResubmissionStatusPatch = {
  status?: ClubStatus
  rejectReason?: string
}

export const getClubResubmissionStatusPatch = (
  currentStatus: ClubStatus,
): ClubResubmissionStatusPatch =>
  currentStatus === 'REJECTED'
    ? {
        status: 'PENDING',
        rejectReason: '',
      }
    : {}
