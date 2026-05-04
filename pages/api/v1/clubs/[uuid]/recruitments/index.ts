import { NextApiRequest, NextApiResponse } from 'next'
import { z, ZodIssue } from 'zod'
import { Provider } from 'server/provider'
import { ClubRecruitmentService } from 'server/service/club-recruitment.service'
import { NotFoundError } from 'server/domain/error'
import {
  ClubRecruitmentParamsSchema,
  type PublicClubRecruitmentsResponse,
} from 'src/lib/schemas/club-recruitments'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PublicClubRecruitmentsResponse | string | ZodIssue[]>,
) {
  try {
    const clubRecruitmentService = Provider.getService(ClubRecruitmentService)

    if (req.method === 'GET') {
      const { uuid: clubUuid } = ClubRecruitmentParamsSchema.parse(req.query)
      const { clubName, recruitments } = await clubRecruitmentService.findPublicRecruitmentsByClub(
        clubUuid,
      )
      return res.status(200).json({
        success: true,
        message: '해당 동아리의 공고 목록 조회가 완료되었습니다.',
        data: {
          club_name: clubName,
          recruitments: recruitments.map((recruitment) => ({
            id: Number(recruitment.id),
            display_title: toDisplayTitle(recruitment.yearMonth),
            title: recruitment.title,
            deadline: recruitment.deadline,
            is_active: new Date(recruitment.deadline).getTime() > Date.now(),
          })),
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
    console.error('list public club recruitments error: ', err)
    return res.status(500).send('Internal Server Error')
  }

  return res.status(405).end()
}

function toDisplayTitle(yearMonth: string): string {
  const [year, month] = yearMonth.split('-')
  return `${year}년 ${Number(month)}월 공고`
}
