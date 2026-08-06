import { IsNull, Repository } from 'typeorm'
import { InjectRepository, Service } from '../provider'
import { UserNotificationEntity } from '../infra/database/entities'
import { toUserNotificationDomain, UserNotification } from '../domain/model/UserNotification'
import { NotFoundError } from '../domain/error'

@Service
export class UserNotificationService {
  @InjectRepository(UserNotificationEntity)
  private readonly userNotificationRepository: Repository<UserNotificationEntity>

  async findByUser(serviceUserId: string): Promise<{
    notifications: UserNotification[]
    unreadCount: number
  }> {
    const [notifications, unreadCount] = await Promise.all([
      this.userNotificationRepository.find({
        where: { serviceUserId },
        order: {
          createdAt: 'DESC',
          id: 'DESC',
        },
      }),
      this.userNotificationRepository.count({
        where: {
          serviceUserId,
          readAt: IsNull(),
        },
      }),
    ])

    return {
      notifications: notifications.map(toUserNotificationDomain),
      unreadCount,
    }
  }

  async markAsRead(serviceUserId: string, notificationId: string): Promise<void> {
    const result = await this.userNotificationRepository.update(
      {
        id: notificationId,
        serviceUserId,
        readAt: IsNull(),
      },
      {
        readAt: new Date().toISOString(),
      },
    )

    if ((result.affected ?? 0) > 0) {
      return
    }

    const notification = await this.userNotificationRepository.findOneBy({
      id: notificationId,
      serviceUserId,
    })
    if (!notification) {
      throw new NotFoundError('notification not found')
    }
  }
}
