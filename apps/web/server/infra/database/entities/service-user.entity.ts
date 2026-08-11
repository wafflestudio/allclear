import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm'
import { CollegeMajorEntity } from './college-major.entity'
import { TimeStampMixin } from './TimeStampMixin'
import { UserEntity } from './user.entity'

@Entity('allclear_user')
@Index('ix_allclear_user_user_id', ['userId'])
export class ServiceUserEntity extends TimeStampMixin {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string

  @OneToOne(
    () => UserEntity,
    (user) => user.serviceUser,
  )
  @JoinColumn({ name: 'user_id' })
  user: UserEntity

  @Column({ type: 'int', nullable: true, name: 'college_major_id' })
  collegeMajorId: number | null

  @ManyToOne(() => CollegeMajorEntity, { nullable: true })
  @JoinColumn({ name: 'college_major_id' })
  collegeMajor: CollegeMajorEntity | null

  @Column({ type: 'smallint', nullable: true, name: 'admission_class' })
  admissionClass: number | null
}
