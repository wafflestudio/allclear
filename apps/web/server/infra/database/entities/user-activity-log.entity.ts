import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

export enum UserActivityLogType {
  CALL_GET_CLUB_API = 'CALL_GET_CLUB_API',
  CALL_LIST_CLUBS_OF_CATEGORY_API = 'CALL_LIST_CLUBS_OF_CATEGORY_API',
  CALL_SEARCH_CLUBS_API = 'CALL_SEARCH_CLUBS_API',
  CALL_LIST_POPULAR_CLUBS_API = 'CALL_LIST_POPULAR_CLUBS_API',
  CALL_GET_CATEGORY_LIST_API = 'CALL_GET_CATEGORY_LIST_API',
  EDIT_CLUB = 'EDIT_CLUB',
  OPEN_APP_DOWNLOAD_PAGE = 'OPEN_APP_DOWNLOAD_PAGE',
}

@Entity('user_activity_log')
export class UserActivityLogEntity {
  @PrimaryGeneratedColumn('increment', { name: 'id' })
  id: number

  @Column({ type: 'enum', enum: UserActivityLogType, name: 'type' })
  type: UserActivityLogType

  @Column({ type: 'varchar', default: '', name: 'user_device' })
  userDevice: string

  @Column({ type: 'varchar', default: '', name: 'user_ip' })
  userIp: string

  @Column({ type: 'varchar', nullable: true, name: 'params' })
  params: string

  @Column({
    type: 'timestamp with time zone',
    default: () => 'NOW()',
    name: 'created_at',
  })
  createdAt: string
}
