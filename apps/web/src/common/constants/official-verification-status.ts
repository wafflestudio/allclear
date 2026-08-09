export const OFFICIAL_VERIFICATION_STATUSES = ['VERIFIED', 'PENDING', 'UNVERIFIED'] as const

export type OfficialVerificationStatus = (typeof OFFICIAL_VERIFICATION_STATUSES)[number]
