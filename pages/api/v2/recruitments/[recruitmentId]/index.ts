import { NextApiRequest, NextApiResponse } from 'next'
import { z, ZodIssue } from 'zod'
import { Provider } from 'server/provider'
import { ClubRecruitmentService } from 'server/service/club-recruitment.service'
import { NotFoundError } from 'server/domain/error'
import {
  RecruitmentIdParamsSchema,
  type PublicClubRecruitmentDetailResponse,
} from 'src/lib/schemas/club-recruitments'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PublicClubRecruitmentDetailResponse | string | ZodIssue[]>,
) {
  try {
    const clubRecruitmentService = Provider.getService(ClubRecruitmentService)

    if (req.method === 'GET') {
      const { recruitmentId } = RecruitmentIdParamsSchema.parse(req.query)
      const recruitment = await clubRecruitmentService.findPublicRecruitmentById(recruitmentId)

      return res.status(200).json({
        success: true,
        data: {
          id: Number(recruitment.id),
          display_title: toDisplayTitle(recruitment.yearMonth),
          club_id: recruitment.clubId,
          content: {
            title: recruitment.title,
            deadline: recruitment.deadline,
            is_mandatory: recruitment.isMandatory,
            has_regular_meeting: recruitment.hasRegularMeeting,
            regular_meetings: recruitment.regularMeetings.map((regularMeeting) => ({
              day_of_week: regularMeeting.dayOfWeek,
              start_time: regularMeeting.startTime,
              end_time: regularMeeting.endTime,
            })),
            activity_location_type: recruitment.activityLocationType,
            activity_location_text: recruitment.activityLocationText,
            has_eligibility: recruitment.hasEligibility,
            eligibility_text: recruitment.eligibilityText,
            has_capacity_limit: recruitment.hasCapacityLimit,
            capacity_limit_text: recruitment.capacityLimitText,
            has_membership_fee: recruitment.hasMembershipFee,
            membership_fee_text: recruitment.membershipFeeText,
            application_url: recruitment.applicationUrl,
            application_process: recruitment.applicationProcess,
            full_recruitment_text: recruitment.fullRecruitmentText,
            image_urls: recruitment.imageUrls,
          },
        },
      })
    }
  } catch (err) {
    if (err instanceof NotFoundError) {
      return res.status(404).send('resource not found')
    }
    if (err instanceof z.ZodError) {
      return res.status(400).json(err.errors)
    }
    console.error('get public recruitment detail error: ', err)
    return res.status(500).send('Internal Server Error')
  }

  return res.status(405).end()
}

function toDisplayTitle(yearMonth: string): string {
  const [year, month] = yearMonth.split('-')
  return `${year}년 ${Number(month)}월 공고`
}
