import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'
import { TimeStampMixin } from './TimeStampMixin'
import { AccountType } from './account-type.enum'

@Entity('account')
@Index('ix_account_type_username', ['type', 'username'])
export class AccountEntity extends TimeStampMixin {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string

  @Column({ type: 'enum', enum: AccountType, name: 'type' })
  type: AccountType

  @Column({ type: 'varchar', length: 255, name: 'username' })
  username: string

  @Column({ type: 'varchar', length: 64, default: '', name: 'password' })
  password: string

  @Column({ type: 'simple-json', nullable: true, name: 'social_info' })
  socialInfo: object | null

  @Column({ type: 'timestamp', precision: 6, nullable: true, name: 'last_login_at' })
  lastLoginAt: string | null

  @Column({ type: 'varchar', length: 200, nullable: true, name: 'auth_token' })
  authToken: string | null
}
