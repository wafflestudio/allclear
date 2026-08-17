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
  description: string
  shortDescription: string
  introduction: string
  type: string
  category: string
  affiliationType: string
  collegeMajorId: number | null
  collegeMajor: ClubCollegeMajor | null
  recruitType: string
  isOfficialVerified: boolean
  verifiedAt: string | null
  hasDongbang: boolean
  dongbangLocation: string
  minActivityPeriod: number
  activeMemberCount: number
  snsUrls: string[]
  imageUri: string
  article: string
  articleUploadedAt: string | null
  status: ClubStatus
  rejectReason: string
}
