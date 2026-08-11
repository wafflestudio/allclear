import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { ClubReviewKeywordEntity } from './club-review-keyword.entity'
import { TimeStampMixin } from './TimeStampMixin'

@Entity('club_review_keyword_category')
export class ClubReviewKeywordCategoryEntity extends TimeStampMixin {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id: number

  @Column({ type: 'smallint', name: 'sort_order' })
  sortOrder: number

  @Column({ type: 'varchar', length: 64, name: 'title' })
  title: string

  @OneToMany(
    () => ClubReviewKeywordEntity,
    (keyword) => keyword.category,
  )
  reviewKeywords: ClubReviewKeywordEntity[]
}
