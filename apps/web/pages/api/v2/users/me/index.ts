import type { NextApiRequest, NextApiResponse } from 'next'
import type { User } from 'server/domain/model/User'
import { Provider } from 'server/provider'
import { UpdateProfileSchema } from 'server/schemas/users'
import { UserService } from 'server/service/user.service'
import { type ZodIssue, z } from 'zod'
import { UserNotFoundError } from '../../../../../server/domain/error'
import { bearerToken } from '../../../../../server/util/token'

type ResponseData = {
  profile: User
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | string | ZodIssue[]>,
) {
  try {
    const userService = Provider.getService(UserService)
    if (req.method === 'GET') {
      const user = await userService.getUserByAccountId(req.headers.user as string)

      // mark login timestamp and auth token
      userService
        .markLogin(
          user.id,
          bearerToken({
            get: (name: string) => req.headers[name],
          }),
        )
        .catch(console.error)
      return res.status(200).json({
        profile: user,
      })
    }
    if (req.method === 'PUT') {
      const user = await userService.getUserByAccountId(req.headers.user as string)
      const updateProfileDto = UpdateProfileSchema.parse(req.body)
      await userService.updateProfile(user, updateProfileDto)
      return res.status(204).end()
    }
  } catch (err) {
    if (err instanceof UserNotFoundError) {
      return res.status(404).send('user not found')
    }
    if (err instanceof z.ZodError) {
      return res.status(400).json(err.errors)
    }
    console.error('myProfile error: ', err)
    return res.status(500).send('internal server error')
  }
}
