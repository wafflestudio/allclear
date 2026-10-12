import type {
  ClubRecruitmentActivityLocationType,
  RegularMeetingDay,
} from 'server/domain/constants/club-recruitment'

export type RegularMeeting = {
  id: string
  dayOfWeek: RegularMeetingDay
  startTime: string | null
  endTime: string | null
}

export type ClubRecruitment = {
  id: string
  clubId: string
  title: string
  deadline: string
  isMandatory: boolean
  hasRegularMeeting: boolean
  regularMeetings: RegularMeeting[]
  activityLocationType: ClubRecruitmentActivityLocationType
  activityLocationText: string
  hasEligibility: boolean
  eligibilityText: string
  hasCapacityLimit: boolean
  capacityLimitText: string
  hasMembershipFee: boolean
  membershipFeeText: string
  applicationUrl: string
  applicationProcess: string
  fullRecruitmentText: string | null
  imageUrls: string[]
  yearMonth: string
  createdAt: string
  updatedAt: string
}
