import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { ClubRecruitmentEntity } from './club-recruitment.entity'

@Entity('regular_meeting')
export class RegularMeetingEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', name: 'id' })
  id: string

  @Column({ type: 'bigint', name: 'club_recruitment_id' })
  clubRecruitmentId: string

  @ManyToOne(() => ClubRecruitmentEntity, (clubRecruitment) => clubRecruitment.regularMeetings, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'club_recruitment_id' })
  clubRecruitment: ClubRecruitmentEntity

  @Column({ type: 'varchar', default: '월요일', name: 'day_of_week' })
  dayOfWeek: string

  @Column({ type: 'time', nullable: true, name: 'start_time' })
  startTime: string | null

  @Column({ type: 'time', nullable: true, name: 'end_time' })
  endTime: string | null
}
