import type { NextApiRequest, NextApiResponse } from 'next'
import { NotFoundError } from 'server/domain/error'
import type { ClubDetail } from 'server/domain/model/Club'
import { Provider } from 'server/provider'
import { ClubUuidParamsSchema } from 'server/schemas/clubs'
import { ClubService } from 'server/service/club.service'
import { type ZodIssue, z } from 'zod'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ClubDetail | string | ZodIssue[]>,
) {
  try {
    const clubService = Provider.getService(ClubService)
    if (req.method == 'GET') {
      const { uuid: ClubUuid } = ClubUuidParamsSchema.parse(req.query)
      const club = await clubService.findPublicByUuid(ClubUuid)
      return res.status(200).json(club)
    }
  } catch (err) {
    if (err instanceof NotFoundError) {
      return res.status(404).send('club not found')
    }
    if (err instanceof z.ZodError) {
      return res.status(400).json(err.errors)
    }
    console.error('getClubDetail error: ', err)
    return res.status(500).send('Internal Server Error')
  }
}
