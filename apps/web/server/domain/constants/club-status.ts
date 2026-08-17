export const CLUB_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const

export type ClubStatus = (typeof CLUB_STATUSES)[number]

export const PENDING_CLUB_STATUS: ClubStatus = 'PENDING'
export const PUBLIC_CLUB_STATUS: ClubStatus = 'APPROVED'
export const REJECTED_CLUB_STATUS: ClubStatus = 'REJECTED'

export const CLUB_DECISION_STATUSES = ['APPROVED', 'REJECTED'] as const

export type ClubDecisionStatus = (typeof CLUB_DECISION_STATUSES)[number]
