import { NextApiRequest, NextApiResponse } from 'next'
import { Provider } from 'server/provider'
import { UserServiceV1 } from 'server/service/v1/user.service'
import { UserNotFoundError } from 'server/domain/error'
import { ClubServiceV1 } from 'server/service/v1/club.service'
import { z } from 'zod'

const QueryValidator = z.object({
  uuid: z.string().uuid(),
})
export default async function handler(req: NextApiRequest, res: NextApiResponse<null | string>) {
  try {
    const userService = Provider.getService(UserServiceV1)
    const clubService = Provider.getService(ClubServiceV1)

    const { uuid: clubUuid } = QueryValidator.parse(req.query)
    if (req.method === 'POST') {
      const user = await userService.getUserByAccountId(req.headers.user as string)
      await clubService.saveClubToMyCollection(user.serviceUserId, clubUuid)
      return res.status(204).send(null)
    } else if (req.method === 'DELETE') {
      const user = await userService.getUserByAccountId(req.headers.user as string)
      await clubService.unsaveClubFromMyCollection(user.serviceUserId, clubUuid)
      return res.status(204).send(null)
    }
  } catch (err) {
    if (err instanceof UserNotFoundError) {
      return res.status(404).send('user not found')
    }
    console.error('mySavedClubs error: ', err)
    return res.status(500).send('internal server error')
  }
}
