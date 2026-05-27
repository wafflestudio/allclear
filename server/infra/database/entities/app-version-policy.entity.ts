import { Column, Entity, PrimaryColumn } from 'typeorm'
import { BaseTimeStampMixin } from './TimeStampMixin'

export type AppClientType = 'android' | 'ios'

@Entity('app_version_policy')
export class AppVersionPolicyEntity extends BaseTimeStampMixin {
  @PrimaryColumn({ type: 'varchar', length: 16, name: 'client_type' })
  clientType: AppClientType

  @Column({ type: 'varchar', length: 32, name: 'min_supported_version' })
  minSupportedVersion: string
}
