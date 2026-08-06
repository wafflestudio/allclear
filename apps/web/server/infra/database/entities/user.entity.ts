import { Column, Entity, Index, OneToOne, PrimaryGeneratedColumn } from 'typeorm'
import { TimeStampMixin } from './TimeStampMixin'
import { UserRole } from './user-role.enum'
import { ServiceUserEntity } from './service-user.entity'

export const SERVICE = 'allclear' as const

@Entity('user')
@Index('ix_user_service', ['service'])
export class UserEntity extends TimeStampMixin {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string

  @Column({ type: 'varchar', length: 32, name: 'service' })
  service: typeof SERVICE

  @OneToOne(() => ServiceUserEntity, (serviceUser) => serviceUser.user, {
    eager: true,
  })
  serviceUser: ServiceUserEntity

  @Column({ type: 'varchar', length: 32, default: '', name: 'nickname' })
  nickname: string

  @Column({ type: 'varchar', length: 32, default: '', name: 'name' })
  name: string

  @Column({ type: 'varchar', length: 32, default: '', name: 'phone' })
  phone: string

  @Column({ type: 'varchar', length: 80, default: '', name: 'email' })
  email: string

  @Column({ type: 'enum', default: '', enum: UserRole, name: 'role' })
  role: UserRole

  @Column({ type: 'varchar', length: 8, default: '', name: 'gender' })
  gender: string

  @Column({ type: 'date', nullable: true, name: 'birth_date' })
  birthDate: string | null

  @Column({ type: 'varchar', length: 4, default: '', name: 'birth_year' })
  birthYear: string

  @Column({ type: 'boolean', default: false, name: 'terms_of_service_agreement' })
  termsOfServiceAgreement: boolean

  @Column({ type: 'boolean', default: false, name: 'push_notification_agreement' })
  pushNotificationAgreement: boolean

  @Column({ type: 'boolean', default: false, name: 'night_push_notification_agreement' })
  nightPushNotificationAgreement: boolean
}
