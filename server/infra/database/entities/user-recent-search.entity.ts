import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'
import { BaseTimeStampMixin } from './TimeStampMixin'

@Entity('user_recent_search')
@Index('ix_user_recent_search_service_user_updated_at', ['serviceUserId', 'updatedAt'])
@Index('ux_user_recent_search_service_user_query', ['serviceUserId', 'query'], { unique: true })
export class UserRecentSearchEntity extends BaseTimeStampMixin {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', name: 'id' })
  id: string

  @Column({ type: 'uuid', name: 'service_user_id' })
  serviceUserId: string

  @Column({ type: 'text', name: 'query' })
  query: string
}
