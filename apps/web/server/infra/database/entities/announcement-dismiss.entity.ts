import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Entity('announcement_dismiss')
@Index('ux_announcement_dismiss_announcement_user', ['announcementId', 'userId'], { unique: true })
@Index('ix_announcement_dismiss_user_id', ['userId'])
export class AnnouncementDismissEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number

  @Column({ type: 'int', name: 'announcement_id' })
  announcementId: number

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string

  @Column({ type: 'timestamp', name: 'dismissed_at' })
  dismissedAt: string
}
