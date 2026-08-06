import { Entity, ManyToOne, PrimaryColumn } from 'typeorm'
import { CreatedTimeStampMixin } from './TimeStampMixin'
import { UserEntity } from './user.entity'

@Entity('account_user')
export class AccountUserEntity extends CreatedTimeStampMixin {
  @PrimaryColumn({ type: 'uuid', name: 'account_id' })
  accountId: string

  @PrimaryColumn({ type: 'uuid', name: 'user_id' })
  userId: string

  @ManyToOne(() => UserEntity)
  user: UserEntity
}
