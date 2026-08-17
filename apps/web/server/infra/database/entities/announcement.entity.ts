import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'
import { BaseTimeStampMixin } from './TimeStampMixin'

@Entity('announcement')
@Index('ux_announcement_uuid', ['uuid'], { unique: true })
export class AnnouncementEntity extends BaseTimeStampMixin {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number

  @Column({ type: 'uuid', name: 'uuid' })
  uuid: string

  @Column({ type: 'varchar', length: 255, name: 'title' })
  title: string

  @Column({ type: 'text', name: 'content' })
  content: string

  @Column({ type: 'timestamp', name: 'start_at' })
  startAt: string

  @Column({ type: 'timestamp', nullable: true, name: 'end_at' })
  endAt: string | null

  @Column({ type: 'boolean', default: false, name: 'active' })
  active: boolean
}
