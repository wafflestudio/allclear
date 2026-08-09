import type { NextApiRequest, NextApiResponse } from 'next'
import { NotFoundError, UserNotFoundError } from 'server/domain/error'
import type { UserNotification } from 'server/domain/model/UserNotification'
import { Provider } from 'server/provider'
import { UserService } from 'server/service/user.service'
import { UserNotificationService } from 'server/service/user-notification.service'
import { type ZodIssue, z } from 'zod'

type ResponseData = {
  notifications: UserNotification[]
  totalSize: number
  unreadCount: number
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | string | ZodIssue[]>,
) {
  try {
    const userService = Provider.getService(UserService)
    const userNotificationService = Provider.getService(UserNotificationService)

    if (req.method === 'GET') {
      const user = await userService.getUserByAccountId(req.headers.user as string)
      const { notifications, unreadCount } = await userNotificationService.findByUser(
        user.serviceUserId,
      )
      return res.status(200).json({
        notifications,
        totalSize: notifications.length,
        unreadCount,
      })
    }

    return res.status(405).send('method not allowed')
  } catch (err) {
    if (err instanceof UserNotFoundError || err instanceof NotFoundError) {
      return res.status(404).send(err.message)
    }
    if (err instanceof z.ZodError) {
      return res.status(400).json(err.errors)
    }
    console.error('userNotifications error: ', err)
    return res.status(500).send('internal server error')
  }
}
