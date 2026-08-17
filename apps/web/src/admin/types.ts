import type { ClubDecisionStatus, ClubStatus } from 'server/domain/constants/club-status'
import type {
  AdminClubDetailResponse,
  AdminClubHistoriesResponse,
  AdminClubManagerRequestsResponse,
  AdminClubsResponse,
  AdminClubVerificationRequestsResponse,
} from 'src/lib/schemas/admin'

export type { ClubDecisionStatus as DecisionStatus, ClubStatus }

export type StatusFilter = ClubStatus | 'ALL'
export type AffiliationFilter = 'ALL' | 'CENTRAL' | 'NON_CENTRAL'
export type AdminTab = 'clubs' | 'managerRequests' | 'verificationRequests' | 'histories'

export type AdminClub = AdminClubsResponse['data']['clubs'][number]
export type AdminClubDetail = AdminClubDetailResponse['data']
export type ManagerRequest = AdminClubManagerRequestsResponse['data']['requests'][number]
export type VerificationRequest = AdminClubVerificationRequestsResponse['data']['requests'][number]
export type ClubHistory = AdminClubHistoriesResponse['data']['histories'][number]
