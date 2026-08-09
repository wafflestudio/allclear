import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'
import { TimeStampMixin } from './TimeStampMixin'

@Entity('device')
@Index('ix_device_user_id', ['userId'])
@Index('ux_device_userid_pushid', ['userId', 'pushId'], { unique: true })
export class DeviceEntity extends TimeStampMixin {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string

  @Column({ type: 'varchar', length: 64, default: '', name: 'push_id' })
  pushId: string

  @Column({ type: 'varchar', length: 64, default: '', name: 'app_version' })
  appVersion: string

  @Column({ type: 'text', default: '', name: 'device_info' })
  deviceInfo: string
}
