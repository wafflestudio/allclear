import type {
  ClubRecruitmentActivityLocationType,
  RegularMeetingDay,
} from 'src/common/constants/club-recruitment'
import { ClubRecruitmentEntity } from '../../infra/database/entities/club-recruitment.entity'

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

export const toClubRecruitmentDomain = (it: ClubRecruitmentEntity): ClubRecruitment => ({
  id: String(it.id),
  clubId: it.clubId,
  title: it.title,
  deadline: it.deadline,
  isMandatory: it.isMandatory,
  hasRegularMeeting: it.hasRegularMeeting,
  regularMeetings: (it.regularMeetings ?? []).map((regularMeeting) => ({
    id: String(regularMeeting.id),
    dayOfWeek: regularMeeting.dayOfWeek as RegularMeetingDay,
    startTime: regularMeeting.startTime,
    endTime: regularMeeting.endTime,
  })),
  activityLocationType: it.activityLocationType as ClubRecruitmentActivityLocationType,
  activityLocationText: it.activityLocationText,
  hasEligibility: it.hasEligibility,
  eligibilityText: it.eligibilityText,
  hasCapacityLimit: it.hasCapacityLimit,
  capacityLimitText: it.capacityLimitText,
  hasMembershipFee: it.hasMembershipFee,
  membershipFeeText: it.membershipFeeText,
  applicationUrl: it.applicationUrl,
  applicationProcess: it.applicationProcess,
  fullRecruitmentText: it.fullRecruitmentText,
  imageUrls: it.imageUrls ?? [],
  yearMonth: it.yearMonth,
  createdAt: it.createdAt,
  updatedAt: it.updatedAt,
})
