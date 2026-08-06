import { NextApiRequest, NextApiResponse } from 'next'
import { Provider } from 'server/provider'
import { ClubServiceV1 } from 'server/service/v1/club.service'
import { V1Club } from 'server/service/v1/club.service'
import { z, ZodIssue } from 'zod'

const QueryValidator = z.object({
  uuid: z.string().uuid(),
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<V1Club | string | ZodIssue[]>,
) {
  try {
    const clubService = Provider.getService(ClubServiceV1)
    if (req.method == 'GET') {
      const { uuid: ClubUuid } = QueryValidator.parse(req.query)
      const club = await clubService.findByUuid(ClubUuid)
      return res.status(200).json(club)
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json(err.errors)
    }
    console.error('getClubDetail error: ', err)
    return res.status(500).send('Internal Server Error')
  }
}
