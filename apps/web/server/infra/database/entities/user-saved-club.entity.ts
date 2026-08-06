import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { BaseTimeStampMixin } from './TimeStampMixin'

@Entity('user_saved_club')
export class UserSavedClubEntity extends BaseTimeStampMixin {
  @PrimaryGeneratedColumn('increment', { name: 'id' })
  id: number

  @Column({ type: 'uuid', name: 'service_user_id' })
  serviceUserId: string

  @Column('uuid', { name: 'club_id' })
  clubId: string
}
