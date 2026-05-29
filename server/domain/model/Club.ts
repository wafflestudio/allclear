import { ClubEntity } from '../../infra/database/entities'
import { ENV } from '../../ENV'
import { CollegeMajor } from './CollegeMajor'
import type { ClubStatus } from 'src/common/constants/club-status'
import { normalizeClubRecruitType } from 'src/common/constants/club-recruit-type'

export type ClubManager = {
  serviceUserId: string
  name: string
  phone: string
  studentId: string
}

export type ManagedClubDetail = Club & {
  managers: ClubManager[]
}

export type ReviewKeyword = {
  id: string
  title: string
  color: string
  iconUri: string
  totalUpvotes: number
}

export type Club = {
  // uuid와 동일한 필드. 기존의 id는 number 타입이었으나, string 타입으로 변경되었다.
  id: string
  uuid: string
  name: string
  fullName: string
  description: string
  shortDescription: string
  introduction: string
  type: string
  category: string
  college: string
  affiliationType: string
  collegeMajorId: number | null
  collegeMajor: CollegeMajor | null
  recruitType: string
  isOfficialVerified: boolean
  verifiedAt: string | null
  isPopular: boolean
  hasDongbang: boolean
  dongbangLocation: string
  activityCycle: string
  minActivityPeriod: number
  activeMemberCount: number
  membershipFee: string
  sns: string
  tags: string[]
  imageUri: string
  blurHash: string | null
  article: string
  articleUploadedAt: string | null
  status: ClubStatus
  rejectReason: string
  avgRating: number
  totalReviews: number
  reviewKeywords: ReviewKeyword[]
  latestComment: string
}

export const toClubDomain = (
  it: ClubEntity,
  review?: {
    totalReviews: number
    avgRating: number
    reviewKeywords: ReviewKeyword[]
    latestComment: string
  },
): Club => ({
  id: it.uuid,
  uuid: it.uuid,
  name: it.name,
  fullName: it.fullName,
  description: it.description,
  shortDescription: it.shortDescription ?? '',
  introduction: it.introduction ?? '',
  type: it.type,
  category: it.category,
  college: it.college ?? '',
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
  isPopular: it.isPopular,
  hasDongbang: it.hasDongbang,
  dongbangLocation: it.dongbangLocation ?? '',
  activityCycle: it.activityCycle ?? '',
  minActivityPeriod: it.minActivityPeriod ?? 0,
  activeMemberCount: it.activeMemberCount ?? 0,
  membershipFee: it.membershipFee ?? '',
  sns: it.sns ?? '',
  tags: it.tags,
  imageUri: encode(it.imageUri) || ENV.R2.DEFAULT_CLUB_IMAGE,
  blurHash: it.blurHash,
  article: it.article ?? '',
  articleUploadedAt: it.articleUploadedAt,
  status: it.status,
  rejectReason: it.rejectReason ?? '',
  avgRating: review?.avgRating ?? 0,
  totalReviews: review?.totalReviews ?? 0,
  reviewKeywords: review?.reviewKeywords ?? [],
  latestComment: review?.latestComment ?? '',
})

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
