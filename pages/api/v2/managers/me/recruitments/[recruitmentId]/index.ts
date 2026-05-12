import { NextApiRequest, NextApiResponse } from 'next'
import { z, ZodIssue } from 'zod'
import { Provider } from 'server/provider'
import { ClubRecruitmentService } from 'server/service/club-recruitment.service'
import { UserService } from 'server/service/user.service'
import { ForbiddenError, NotFoundError, UserNotFoundError } from 'server/domain/error'
import {
  RecruitmentIdParamsSchema,
  UpdateClubRecruitmentSchema,
  type UpdateRecruitmentResponse,
} from 'src/lib/schemas/club-recruitments'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UpdateRecruitmentResponse | string | ZodIssue[]>,
) {
  try {
    const clubRecruitmentService = Provider.getService(ClubRecruitmentService)
    const userService = Provider.getService(UserService)
    const user = await userService.getUserByAccountId(req.headers.user as string)
    const { recruitmentId } = RecruitmentIdParamsSchema.parse(req.query)

    if (req.method === 'DELETE') {
      await clubRecruitmentService.deleteRecruitment(recruitmentId, user.serviceUserId)
      return res.status(204).end()
    }

    if (req.method === 'PATCH') {
      const body = UpdateClubRecruitmentSchema.parse(req.body)
      const recruitment = await clubRecruitmentService.updateRecruitment(
        recruitmentId,
        user.serviceUserId,
        body,
      )
      return res.status(200).json({
        success: true,
        message: '모집 공고 수정이 완료되었습니다.',
        data: {
          recruitment_id: Number(recruitment.id),
          club_uuid: recruitment.clubId,
          year_month: recruitment.yearMonth,
          deadline: recruitment.deadline,
          updated_at: recruitment.updatedAt,
        },
      })
    }
  } catch (err) {
    if (err instanceof UserNotFoundError) {
      return res.status(404).send('user not found')
    }
    if (err instanceof NotFoundError) {
      return res.status(404).send('resource not found')
    }
    if (err instanceof ForbiddenError) {
      return res.status(403).send('forbidden')
    }
    if (err instanceof z.ZodError) {
      return res.status(400).json(err.errors)
    }
    console.error('update recruitment error: ', err)
    return res.status(500).send('Internal Server Error')
  }

  return res.status(405).end()
}
