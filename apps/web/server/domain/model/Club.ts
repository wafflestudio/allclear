import type { ClubRecruitType } from 'server/domain/constants/club-recruit-type'
import { normalizeClubRecruitType } from 'server/domain/constants/club-recruit-type'
import type { ClubStatus } from 'server/domain/constants/club-status'
import { PENDING_CLUB_STATUS } from 'server/domain/constants/club-status'
import type { OfficialVerificationStatus } from 'server/domain/constants/official-verification-status'
import { ENV } from '../../ENV'
import type { ClubEntity } from '../../infra/database/entities'
import type { CollegeMajor } from './CollegeMajor'

export type ClubManager = {
  serviceUserId: string
  name: string
  phone: string
  studentId: string
}

export type ManagedClubDetail = Club & {
  managers: ClubManager[]
  officialVerification: ManagedOfficialVerification
}

export type ManagedOfficialVerificationStatus = 'VERIFIED' | 'PENDING' | 'REJECTED' | 'UNVERIFIED'

export type ManagedOfficialVerification = {
  status: ManagedOfficialVerificationStatus
  requestId: number | null
  attemptNo: number | null
  retryCount: number
  retryLimit: number
  remainingRetryCount: number
  rejectReason: string | null
  requestedAt: string | null
}

export type ManagedClubManagementStatus =
  | 'APPROVED'
  | 'REJECTED'
  | 'MANAGER_REQUEST_REJECTED'
  | 'PENDING'
  | 'MANAGER_REQUEST_PENDING'

export type ManagedClubListItem = Club & {
  managementStatus: ManagedClubManagementStatus
  hasManager: boolean
  managerRequestId?: number
}

export type ReviewKeyword = {
  id: string
  title: string
  iconUri: string
  totalUpvotes: number
}

type ClubReviewSummary = {
  totalReviews: number
  reviewKeywords: ReviewKeyword[]
}

export type Club = {
  // uuid와 동일한 필드. 기존의 id는 number 타입이었으나, string 타입으로 변경되었다.
  id: string
  uuid: string
  name: string
  description: string
  shortDescription: string
  introduction: string
  type: string
  category: string
  affiliationType: string
  collegeMajorId: number | null
  collegeMajor: CollegeMajor | null
  recruitType: ClubRecruitType
  isOfficialVerified: boolean
  verifiedAt: string | null
  hasDongbang: boolean
  dongbangLocation: string
  minActivityPeriod: number
  activeMemberCount: number
  foundedAt: string | null
  snsUrls: string[]
  activityImageUrls: string[]
  imageUri: string
  article: string
  articleUploadedAt: string | null
  status: ClubStatus
  rejectReason: string
  totalReviews: number
  reviewKeywords: ReviewKeyword[]
}

export type ClubDetail = Club & {
  officialVerificationStatus: OfficialVerificationStatus
}

export const toClubDomain = (it: ClubEntity, review?: ClubReviewSummary): Club => ({
  id: it.uuid,
  uuid: it.uuid,
  name: it.name,
  description: it.description,
  shortDescription: it.shortDescription ?? '',
  introduction: it.introduction ?? '',
  type: it.type,
  category: it.category,
  affiliationType: it.affiliationType,
  collegeMajorId: it.collegeMajorId,
  collegeMajor: it.collegeMajor
    ? {
        id: it.collegeMajor.id,
        college: it.collegeMajor.college,
        major: it.collegeMajor.major,
      }
    : null,
  recruitType: normalizeClubRecruitType(it.recruitType),
  isOfficialVerified: it.isOfficialVerified,
  verifiedAt: it.verifiedAt,
  hasDongbang: it.hasDongbang,
  dongbangLocation: it.dongbangLocation ?? '',
  minActivityPeriod: it.minActivityPeriod ?? 0,
  activeMemberCount: it.activeMemberCount ?? 0,
  foundedAt: it.foundedAt ?? null,
  snsUrls: it.snsUrls ?? [],
  activityImageUrls: it.activityImageUrls ?? [],
  imageUri: encode(it.imageUri) || ENV.R2.DEFAULT_CLUB_IMAGE,
  article: it.article ?? '',
  articleUploadedAt: it.articleUploadedAt,
  status: it.status,
  rejectReason: it.rejectReason ?? '',
  totalReviews: review?.totalReviews ?? 0,
  reviewKeywords: review?.reviewKeywords ?? [],
})

export const toClubDetailDomain = (
  club: ClubEntity,
  review?: ClubReviewSummary,
  latestVerificationRequest?: {
    status: string
  } | null,
): ClubDetail => ({
  ...toClubDomain(club, review),
  officialVerificationStatus: getOfficialVerificationStatus(club, latestVerificationRequest),
})

function getOfficialVerificationStatus(
  club: ClubEntity,
  latestVerificationRequest?: { status: string } | null,
): OfficialVerificationStatus {
  if (club.isOfficialVerified) {
    return 'VERIFIED'
  }

  if (latestVerificationRequest?.status === PENDING_CLUB_STATUS) {
    return 'PENDING'
  }

  return 'UNVERIFIED'
}

function encode(imageUri: string | undefined): string {
  if (!imageUri) {
    return ''
  }
  const splitter = '%2F'
  const parts = imageUri.split(splitter)
  const lastPart = parts.pop() ?? ''

  const encodedLastPart = encodeURIComponent(lastPart)
  return `${parts.join(splitter)}${splitter}${encodedLastPart}`
}
