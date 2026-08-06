import { NextApiRequest, NextApiResponse } from 'next'
import { z, ZodIssue } from 'zod'
import { Provider } from 'server/provider'
import { ClubRecruitmentService } from 'server/service/club-recruitment.service'
import { NotFoundError } from 'server/domain/error'
import {
  ClubRecruitmentParamsSchema,
  type ClubRecruitmentDto,
} from 'src/lib/schemas/club-recruitments'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ClubRecruitmentDto | string | ZodIssue[] | null>,
) {
  try {
    const clubRecruitmentService = Provider.getService(ClubRecruitmentService)

    if (req.method === 'GET') {
      const { uuid: clubUuid } = ClubRecruitmentParamsSchema.parse(req.query)
      const recruitment = await clubRecruitmentService.findPublicRepresentativeRecruitmentByClub(
        clubUuid,
      )
      return res.status(200).json(recruitment)
    }
  } catch (err) {
    if (err instanceof NotFoundError) {
      return res.status(404).send('resource not found')
    }
    if (err instanceof z.ZodError) {
      return res.status(400).json(err.errors)
    }
    console.error('get representative club recruitment error: ', err)
    return res.status(500).send('Internal Server Error')
  }

  return res.status(405).end()
}
