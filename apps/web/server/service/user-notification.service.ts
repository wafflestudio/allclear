import { NotFoundError } from '../domain/error'
import { toUserNotificationDomain, type UserNotification } from '../domain/model/UserNotification'
import { getPrismaClient } from '../infra/database/prisma'
import { Service } from '../provider'

@Service
export class UserNotificationService {
  async findByUser(serviceUserId: string): Promise<{
    notifications: UserNotification[]
    unreadCount: number
  }> {
    const prisma = getPrismaClient()
    const [notifications, unreadCount] = await Promise.all([
      prisma.user_notification.findMany({
        where: { service_user_id: serviceUserId },
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      }),
      prisma.user_notification.count({
        where: { service_user_id: serviceUserId, read_at: null },
      }),
    ])

    return {
      notifications: notifications.map(toUserNotificationDomain),
      unreadCount,
    }
  }

  async markAsRead(serviceUserId: string, notificationId: string): Promise<void> {
    const prisma = getPrismaClient()
    const id = BigInt(notificationId)
    const result = await prisma.user_notification.updateMany({
      where: { id, service_user_id: serviceUserId, read_at: null },
      data: { read_at: new Date() },
    })

    if (result.count > 0) {
      return
    }

    const notification = await prisma.user_notification.findFirst({
      where: { id, service_user_id: serviceUserId },
    })
    if (!notification) {
      throw new NotFoundError('notification not found')
    }
  }
}
