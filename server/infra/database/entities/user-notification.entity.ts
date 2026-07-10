import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

export type UserNotificationType =
  | 'CLUB_REGISTRATION_APPROVED'
  | 'CLUB_REGISTRATION_REJECTED'
  | 'MANAGER_REQUEST_APPROVED'
  | 'MANAGER_REQUEST_REJECTED'

export type UserNotificationSourceType = 'CLUB' | 'CLUB_MANAGER_REQUEST'

@Entity('user_notification')
@Index('idx_user_notification_service_user_created', ['serviceUserId', 'createdAt'])
@Index('idx_user_notification_service_user_unread_created', ['serviceUserId', 'createdAt'], {
  where: '"read_at" IS NULL',
})
export class UserNotificationEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', name: 'id' })
  id: string

  @Column({ type: 'uuid', name: 'service_user_id' })
  serviceUserId: string

  @Column({ type: 'varchar', name: 'type' })
  type: UserNotificationType

  @Column({ type: 'uuid', nullable: true, name: 'club_id' })
  clubId: string | null

  @Column({ type: 'varchar', name: 'source_type' })
  sourceType: UserNotificationSourceType

  @Column({ type: 'varchar', name: 'source_id' })
  sourceId: string

  @Column({ type: 'timestamp with time zone', nullable: true, name: 'read_at' })
  readAt: string | null

  @CreateDateColumn({
    type: 'timestamp with time zone',
    default: () => 'NOW()',
    name: 'created_at',
  })
  createdAt: string
}
