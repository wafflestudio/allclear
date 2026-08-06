import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { TimeStampMixin } from './TimeStampMixin'
import { ClubReviewKeywordEntity } from './club-review-keyword.entity'

@Entity('club_review_keyword_category')
export class ClubReviewKeywordCategoryEntity extends TimeStampMixin {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id: number

  @Column({ type: 'smallint', name: 'sort_order' })
  sortOrder: number

  @Column({ type: 'varchar', length: 64, name: 'title' })
  title: string

  @Column({ type: 'varchar', length: 16, default: '', name: 'color' })
  color: string

  @Column({ type: 'varchar', length: 300, default: '', name: 'icon_uri' })
  iconUri: string

  @OneToMany(() => ClubReviewKeywordEntity, (keyword) => keyword.category)
  reviewKeywords: ClubReviewKeywordEntity[]
}
