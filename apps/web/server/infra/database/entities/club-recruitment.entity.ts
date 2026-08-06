import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { formatYearMonth } from 'src/common/utils/formatYearMonth'
import { RegularMeetingEntity } from './regular-meeting.entity'

@Entity('club_recruitment')
@Index('idx_recruitment_club_id', ['clubId'])
@Index('idx_recruitment_deadline', ['deadline'])
@Index('idx_unique_club_month_active', ['clubId', 'yearMonth'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
export class ClubRecruitmentEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', name: 'id' })
  id: string

  @Column({ type: 'uuid', name: 'club_id' })
  clubId: string

  @Column({ type: 'varchar', default: '', name: 'title' })
  title: string

  @Column({ type: 'timestamp with time zone', name: 'deadline' })
  deadline: string

  @Column({ type: 'boolean', default: false, name: 'is_mandatory' })
  isMandatory: boolean

  @Column({ type: 'boolean', default: false, name: 'has_regular_meeting' })
  hasRegularMeeting: boolean

  @OneToMany(() => RegularMeetingEntity, (regularMeeting) => regularMeeting.clubRecruitment, {
    eager: true,
  })
  regularMeetings: RegularMeetingEntity[]

  @Column({ type: 'varchar', default: '', name: 'application_url' })
  applicationUrl: string

  @Column({ type: 'varchar', default: '', name: 'application_process' })
  applicationProcess: string

  @Column({ type: 'varchar', default: '미정', name: 'activity_location_type' })
  activityLocationType: string

  @Column({ type: 'varchar', default: '', name: 'activity_location_text' })
  activityLocationText: string

  @Column({ type: 'boolean', default: false, name: 'has_eligibility' })
  hasEligibility: boolean

  @Column({ type: 'varchar', default: '', name: 'eligibility_text' })
  eligibilityText: string

  @Column({ type: 'boolean', default: false, name: 'has_capacity_limit' })
  hasCapacityLimit: boolean

  @Column({ type: 'varchar', default: '', name: 'capacity_limit_text' })
  capacityLimitText: string

  @Column({ type: 'boolean', default: false, name: 'has_membership_fee' })
  hasMembershipFee: boolean

  @Column({ type: 'varchar', default: '', name: 'membership_fee_text' })
  membershipFeeText: string

  @Column({ type: 'varchar', nullable: true, name: 'full_recruitment_text' })
  fullRecruitmentText: string | null

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb", name: 'image_urls' })
  imageUrls: string[]

  @Column({ type: 'varchar', name: 'year_month' })
  yearMonth: string

  @CreateDateColumn({
    type: 'timestamp with time zone',
    default: () => 'NOW()',
    name: 'created_at',
  })
  createdAt: string

  @UpdateDateColumn({
    type: 'timestamp with time zone',
    default: () => 'NOW()',
    onUpdate: 'NOW()',
    name: 'updated_at',
  })
  updatedAt: string

  @DeleteDateColumn({
    type: 'timestamp with time zone',
    nullable: true,
    select: false,
    name: 'deleted_at',
  })
  deletedAt: string | null

  // year_month는 created_at 기준 파생 컬럼이라 저장 직전에 함께 맞춘다.
  @BeforeInsert()
  @BeforeUpdate()
  syncYearMonth() {
    const createdAt = this.createdAt ?? new Date().toISOString()
    this.createdAt = createdAt
    this.yearMonth = formatYearMonth(createdAt)
  }
}
