export const OFFICIAL_VERIFICATION_STATUSES = ['VERIFIED', 'PENDING', 'UNVERIFIED'] as const
export const MAX_OFFICIAL_VERIFICATION_RETRY_COUNT = 3

export type OfficialVerificationStatus = (typeof OFFICIAL_VERIFICATION_STATUSES)[number]
