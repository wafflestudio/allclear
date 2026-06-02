import { NextApiRequest, NextApiResponse } from 'next'
import { Provider } from 'server/provider'
import { ClubService } from 'server/service/club.service'
import { UserService } from 'server/service/user.service'
import { Club } from 'server/domain/model/Club'
import { z, ZodIssue } from 'zod'
import { ClubUuidParamsSchema } from 'src/lib/schemas/clubs'
import { BadRequestError, NotFoundError, UnauthorizedError } from 'server/domain/error'
import { resolveOptionalAuth } from 'server/util/optional-auth'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Club | string | ZodIssue[]>,
) {
  try {
    const clubService = Provider.getService(ClubService)
    const userService = Provider.getService(UserService)
    if (req.method == 'GET') {
      const { uuid: ClubUuid } = ClubUuidParamsSchema.parse(req.query)
      const auth = await resolveOptionalAuth(req)
      const serviceUserId =
        auth.type === 'member'
          ? await userService
              .getUserByAccountId(auth.accountId)
              .then((u) => u.serviceUserId)
              .catch(() => null)
          : null
      const club = await clubService.findPublicByUuid(ClubUuid, serviceUserId)
      return res.status(200).json(club)
    }
  } catch (err) {
    if (err instanceof NotFoundError) {
      return res.status(404).send('club not found')
    }
    if (err instanceof UnauthorizedError) {
      return res.status(401).send('unauthorized')
    }
    if (err instanceof BadRequestError) {
      return res.status(400).send(err.message)
    }
    if (err instanceof z.ZodError) {
      return res.status(400).json(err.errors)
    }
    console.error('getClubDetail error: ', err)
    return res.status(500).send('Internal Server Error')
  }
}
