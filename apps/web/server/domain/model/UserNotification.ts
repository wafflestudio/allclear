import type {
  UserNotificationMetadata,
  UserNotificationSourceType,
  UserNotificationType,
} from '../../infra/database/entities'
import type { user_notificationModel } from '../../infra/database/generated/prisma/models/user_notification'
import {
  toDatabaseIdString,
  toNullableTimestampString,
  toTimestampString,
} from '../../infra/database/prisma-mapping'

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

export const toUserNotificationDomain = (entity: user_notificationModel): UserNotification => ({
  id: toDatabaseIdString(entity.id),
  type: entity.type as UserNotificationType,
  clubId: entity.club_id,
  sourceType: entity.source_type as UserNotificationSourceType,
  sourceId: entity.source_id,
  metadata: entity.metadata as UserNotificationMetadata | null,
  readAt: toNullableTimestampString(entity.read_at),
  createdAt: toTimestampString(entity.created_at),
})
