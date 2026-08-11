import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm'
import { ServiceUserEntity } from './service-user.entity'
import { TimeStampMixin } from './TimeStampMixin'
import { UserRole } from './user-role.enum'

@Entity('user')
export class UserEntity extends TimeStampMixin {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string

  @OneToOne(
    () => ServiceUserEntity,
    (serviceUser) => serviceUser.user,
    {
      eager: true,
    },
  )
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
}
