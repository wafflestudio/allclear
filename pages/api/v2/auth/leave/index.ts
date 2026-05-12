import type { NextApiRequest, NextApiResponse } from 'next'
import { UserNotFoundError } from 'server/domain/error'
import { Provider } from 'server/provider'
import { AuthService } from 'server/service/auth.service'
import { UserService } from 'server/service/user.service'

type ResponseData = {
  token: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | string>,
) {
  try {
    const authService = Provider.getService(AuthService)
    const userService = Provider.getService(UserService)

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
