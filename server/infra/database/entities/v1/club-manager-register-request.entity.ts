import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { BaseTimeStampMixin } from '../TimeStampMixin'

@Entity('club_manager_register_request')
export class ClubManagerRegisterRequestEntityV1 extends BaseTimeStampMixin {
  @PrimaryGeneratedColumn('increment', { name: 'id' })
  id: number

  @Column({ type: 'uuid', name: 'service_user_id' })
  serviceUserId: string

  @Column('uuid', { name: 'club_id', nullable: true })
  clubId: string | null

  @Column('varchar', { name: 'club_name', length: 200, default: '' })
  clubName: string

  @Column('timestamp', { precision: 6, name: 'approved_at', nullable: true })
  approvedAt: string | null
}
