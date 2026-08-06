import type { ClubStatus } from 'src/common/constants/club-status'

export type ClubCollegeMajor = {
  id: number
  college: string | null
  major: string | null
}

export type Club = {
  id: string
  uuid: string // id와 동일한 필드. 기존의 id는 number 타입이었으나, string 타입으로 변경되었다.
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
  collegeMajor: ClubCollegeMajor | null
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
  snsUrls: string[]
  tags: string[]
  imageUri: string
  article: string
  articleUploadedAt: string | null
  status: ClubStatus
  rejectReason: string
}
