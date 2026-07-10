import { NextApiRequest, NextApiResponse } from 'next'
import { z, ZodIssue } from 'zod'
import { NotFoundError, UserNotFoundError } from 'server/domain/error'
import { Provider } from 'server/provider'
import { UserNotificationService } from 'server/service/user-notification.service'
import { UserService } from 'server/service/user.service'
import { UserNotificationReadParamsSchema } from 'src/lib/schemas/users'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<string | ZodIssue[]>,
) {
  try {
    const userService = Provider.getService(UserService)
    const userNotificationService = Provider.getService(UserNotificationService)

    if (req.method === 'PATCH') {
      const { id } = UserNotificationReadParamsSchema.parse(req.query)
      const user = await userService.getUserByAccountId(req.headers.user as string)
      await userNotificationService.markAsRead(user.serviceUserId, id)
      return res.status(204).end()
    }

    return res.status(405).send('method not allowed')
  } catch (err) {
    if (err instanceof UserNotFoundError || err instanceof NotFoundError) {
      return res.status(404).send(err.message)
    }
    if (err instanceof z.ZodError) {
      return res.status(400).json(err.errors)
    }
    console.error('readUserNotification error: ', err)
    return res.status(500).send('internal server error')
  }
}
