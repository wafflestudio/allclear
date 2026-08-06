import { NextApiRequest, NextApiResponse } from 'next'
import { Provider } from 'server/provider'
import { UserServiceV1 } from 'server/service/v1/user.service'
import { UserNotFoundError } from 'server/domain/error'
import { ZodIssue } from 'zod'
import { V1Club } from 'server/service/v1/club.service'
import { ClubServiceV1 } from 'server/service/v1/club.service'

type ResponseData = {
  clubs: V1Club[]
  totalSize: number
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | string | ZodIssue[]>,
) {
  try {
    const userService = Provider.getService(UserServiceV1)
    const clubService = Provider.getService(ClubServiceV1)

    if (req.method === 'GET') {
      const user = await userService.getUserByAccountId(req.headers.user as string)
      const clubs = await clubService.findMySavedClubs(user.serviceUserId)
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
