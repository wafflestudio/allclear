import { NextApiRequest, NextApiResponse } from 'next'
import { Provider } from 'server/provider'
import { UserService } from 'server/service/user.service'
import { UserNotFoundError } from 'server/domain/error'
import { ZodIssue } from 'zod'
import { Club } from 'server/domain/model/Club'
import { ClubService } from 'server/service/club.service'

type ResponseData = {
  clubs: Club[]
  totalSize: number
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | string | ZodIssue[]>,
) {
  try {
    const userService = Provider.getService(UserService)
    const clubService = Provider.getService(ClubService)

    if (req.method === 'GET') {
      const user = await userService.getUserByAccountId(req.headers.user as string)
      const clubs = await clubService.findClubsReviewedByMe(user.serviceUserId)
      return res.status(200).json({
        clubs,
        totalSize: clubs.length,
      })
    }
  } catch (err) {
    if (err instanceof UserNotFoundError) {
      return res.status(404).send('user not found')
    }
    console.error('myClubs error: ', err)
    return res.status(500).send('internal server error')
  }
}
