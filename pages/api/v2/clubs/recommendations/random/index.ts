import { NextApiRequest, NextApiResponse } from 'next'
import { Provider } from 'server/provider'
import { ClubService } from 'server/service/club.service'
import { UserService } from 'server/service/user.service'
import { Club } from 'server/domain/model/Club'
import { resolveOptionalAuth } from 'server/util/optional-auth'
import { BadRequestError, UnauthorizedError } from 'server/domain/error'

type ResponseData = {
  clubs: Club[]
  totalSize: number
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | string>,
) {
  try {
    const clubService = Provider.getService(ClubService)
    const userService = Provider.getService(UserService)

    if (req.method == 'GET') {
      const auth = await resolveOptionalAuth(req)
      const serviceUserId =
        auth.type === 'member'
          ? await userService
              .getUserByAccountId(auth.accountId)
              .then((u) => u.serviceUserId)
              .catch(() => null)
          : null
      const clubs = await clubService.findRandomRecommendations(10, serviceUserId)
      return res.status(200).json({
        clubs: clubs,
        totalSize: clubs.length,
      })
    }
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return res.status(401).send('unauthorized')
    }
    if (err instanceof BadRequestError) {
      return res.status(400).send(err.message)
    }
    console.error('listRandomRecommendedClubs error: ', err)
    return res.status(500).send('Internal Server Error')
  }
}
