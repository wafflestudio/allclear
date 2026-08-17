import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { BaseTimeStampMixin } from './TimeStampMixin'

@Entity('user_voice')
export class UserVoiceEntity extends BaseTimeStampMixin {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id: number

  @Column({ type: 'uuid', name: 'service_user_id' })
  serviceUserId: string

  @Column({ type: 'text', name: 'content' })
  content: string
}
