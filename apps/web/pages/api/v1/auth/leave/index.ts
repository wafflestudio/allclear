import type { NextApiRequest, NextApiResponse } from 'next'
import { UserNotFoundError } from 'server/domain/error'
import { Provider } from 'server/provider'
import { AuthServiceV1 } from 'server/service/v1/auth.service'
import { UserServiceV1 } from 'server/service/v1/user.service'

type ResponseData = {
  token: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | string>,
) {
  try {
    const authService = Provider.getService(AuthServiceV1)
    const userService = Provider.getService(UserServiceV1)

    if (req.method == 'POST') {
      try {
        const user = await userService.getUserByAccountId(req.headers.user as string)
        await authService.leaveUser(user.id)
        return res.status(204).end()
      } catch (err) {
        if (err instanceof UserNotFoundError) {
          return res.status(404).send('user not found')
        }
        console.error(err)
        return res.status(500).send('internal server error')
      }
    }
    return res.status(405).send('method not allowed')
  } catch (err) {
    console.error('userLeave error: ', err)
    return res.status(500).send('Internal Server Error')
  }
}
