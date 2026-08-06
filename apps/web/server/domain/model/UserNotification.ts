import {
  UserNotificationEntity,
  type UserNotificationMetadata,
  type UserNotificationSourceType,
  type UserNotificationType,
} from '../../infra/database/entities'

export type UserNotification = {
  id: string
  type: UserNotificationType
  clubId: string | null
  sourceType: UserNotificationSourceType
  sourceId: string
  metadata: UserNotificationMetadata | null
  readAt: string | null
  createdAt: string
}

export const toUserNotificationDomain = (entity: UserNotificationEntity): UserNotification => ({
  id: entity.id,
  type: entity.type,
  clubId: entity.clubId,
  sourceType: entity.sourceType,
  sourceId: entity.sourceId,
  metadata: entity.metadata,
  readAt: entity.readAt,
  createdAt: entity.createdAt,
})
