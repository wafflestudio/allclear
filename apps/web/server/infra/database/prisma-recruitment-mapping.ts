import type {
  ClubRecruitmentActivityLocationType,
  RegularMeetingDay,
} from 'server/domain/constants/club-recruitment'
import type { ClubRecruitment } from 'server/domain/model/ClubRecruitment'
import type { club_recruitment } from './generated/prisma/client'
import { toDatabaseIdString, toStringArray, toTimestampString } from './prisma-mapping'

export type RegularMeetingRow = {
  id: bigint
  club_recruitment_id: bigint
  day_of_week: string
  start_time: string | null
  end_time: string | null
}

export function toClubRecruitmentDomain(
  recruitment: club_recruitment,
  regularMeetings: RegularMeetingRow[],
): ClubRecruitment {
  return {
    id: toDatabaseIdString(recruitment.id),
    clubId: recruitment.club_id,
    title: recruitment.title,
    deadline: toTimestampString(recruitment.deadline),
    isMandatory: recruitment.is_mandatory,
    hasRegularMeeting: recruitment.has_regular_meeting,
    regularMeetings: regularMeetings.map((meeting) => ({
      id: toDatabaseIdString(meeting.id),
      dayOfWeek: meeting.day_of_week as RegularMeetingDay,
      startTime: meeting.start_time,
      endTime: meeting.end_time,
    })),
    activityLocationType: recruitment.activity_location_type as ClubRecruitmentActivityLocationType,
    activityLocationText: recruitment.activity_location_text,
    hasEligibility: recruitment.has_eligibility,
    eligibilityText: recruitment.eligibility_text,
    hasCapacityLimit: recruitment.has_capacity_limit,
    capacityLimitText: recruitment.capacity_limit_text,
    hasMembershipFee: recruitment.has_membership_fee,
    membershipFeeText: recruitment.membership_fee_text,
    applicationUrl: recruitment.application_url,
    applicationProcess: recruitment.application_process,
    fullRecruitmentText: recruitment.full_recruitment_text,
    imageUrls: recruitment.image_urls === null ? [] : toStringArray(recruitment.image_urls),
    yearMonth: recruitment.year_month,
    createdAt: toTimestampString(recruitment.created_at),
    updatedAt: toTimestampString(recruitment.updated_at),
  }
}
