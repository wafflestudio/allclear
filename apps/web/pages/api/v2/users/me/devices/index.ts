import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { Provider } from 'server/provider'
import { UserService } from 'server/service/user.service'
import { UserNotFoundError } from 'server/domain/error'
import { UpdateDeviceSchema } from 'src/lib/schemas/users'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const userService = Provider.getService(UserService)
    if (req.method == 'PUT') {
      try {
        const user = await userService.getUserByAccountId(req.headers.user as string)
        const { pushId, appVersion, info } = UpdateDeviceSchema.parse(req.body)
        await userService.updateDevice(user.id, pushId, {
          appVersion,
          info,
        })
        return res.status(204).send(null)
      } catch (err) {
        if (err instanceof UserNotFoundError) {
          return res.status(404).send('user not found')
        }
        if (err instanceof z.ZodError) {
          return res.status(400).json(err.errors)
        }
        console.error(err)
        return res.status(500).send('internal server error')
      }
    }
  } catch (err) {
    console.error('updateDevice error: ', err)
    return res.status(500).send('Internal Server Error')
  }
}
