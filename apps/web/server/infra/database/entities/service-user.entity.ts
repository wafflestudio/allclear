import { Column, Entity, Index, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm'
import { TimeStampMixin } from './TimeStampMixin'
import { UserEntity } from './user.entity'

@Entity('allclear_user')
@Index('ix_allclear_user_user_id', ['userId'])
export class ServiceUserEntity extends TimeStampMixin {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string

  @OneToOne(() => UserEntity, (user) => user.serviceUser)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity

  @Column({ type: 'varchar', length: 40, default: '', name: 'college' })
  college: string

  @Column({ type: 'varchar', length: 40, default: '', name: 'major' })
  major: string

  @Column({ type: 'int', nullable: true, name: 'college_major_id' })
  collegeMajorId: number | null

  @Column({ type: 'smallint', nullable: true, name: 'admission_class' })
  admissionClass: number | null

  @Column({ type: 'smallint', nullable: true, name: 'grade' })
  grade: number | null

  @Column({ type: 'uuid', nullable: true, name: 'university_id' })
  universityId: string | null

  @Column({ type: 'boolean', default: false, name: 'is_university_confirmed' })
  isUniversityConfirmed: boolean

  @Column({ type: 'timestamp', precision: 6, nullable: true, name: 'university_confirmed_at' })
  universityConfirmedAt: string | null
}
