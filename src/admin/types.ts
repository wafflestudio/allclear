import type {
  AdminClubsResponse,
  AdminClubDetailResponse,
  AdminClubManagerRequestsResponse,
  AdminClubVerificationRequestsResponse,
  AdminClubHistoriesResponse,
} from 'src/lib/schemas/admin'
import type { ClubDecisionStatus, ClubStatus } from 'src/common/constants/club-status'

export type { ClubStatus, ClubDecisionStatus as DecisionStatus }

export type StatusFilter = ClubStatus | 'ALL'
export type AdminTab = 'clubs' | 'managerRequests' | 'verificationRequests' | 'histories'

export type AdminClub = AdminClubsResponse['data']['clubs'][number]
export type AdminClubDetail = AdminClubDetailResponse['data']
export type ManagerRequest = AdminClubManagerRequestsResponse['data']['requests'][number]
export type VerificationRequest = AdminClubVerificationRequestsResponse['data']['requests'][number]
export type ClubHistory = AdminClubHistoriesResponse['data']['histories'][number]
