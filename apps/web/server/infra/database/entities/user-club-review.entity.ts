import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { BaseTimeStampMixin } from './TimeStampMixin'

@Entity('user_club_review')
export class UserClubReviewEntity extends BaseTimeStampMixin {
  @PrimaryGeneratedColumn('increment', { name: 'id' })
  id: number

  @Column('uuid', { name: 'club_id' })
  clubId: string

  @Column({ type: 'uuid', name: 'service_user_id' })
  serviceUserId: string

  @Column({ type: 'smallint', default: 0, name: 'rating' })
  rating: number

  @Column({ type: 'uuid', array: true, default: [], name: 'review_keyword_ids' })
  reviewKeywordIds: string[]

  @Column({ type: 'varchar', length: 100, name: 'content', default: '' })
  content: string
}
