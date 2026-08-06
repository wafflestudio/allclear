import { NextApiRequest, NextApiResponse } from 'next'
import { Provider } from 'server/provider'
import { UserService } from 'server/service/user.service'
import { NotFoundError, UserNotFoundError } from 'server/domain/error'
import { ClubService } from 'server/service/club.service'
import { ClubUuidParamsSchema } from 'src/lib/schemas/clubs'
import { z } from 'zod'

export default async function handler(req: NextApiRequest, res: NextApiResponse<null | string>) {
  try {
    const userService = Provider.getService(UserService)
    const clubService = Provider.getService(ClubService)

    const { uuid: clubUuid } = ClubUuidParamsSchema.parse(req.query)
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
    if (err instanceof NotFoundError) {
      return res.status(404).send('club not found')
    }
    if (err instanceof UserNotFoundError) {
      return res.status(404).send('user not found')
    }
    if (err instanceof z.ZodError) {
      return res.status(400).send('invalid club uuid')
    }
    console.error('mySavedClubs error: ', err)
    return res.status(500).send('internal server error')
  }
}
