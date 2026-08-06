import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { TimeStampMixin } from './TimeStampMixin'
import { ClubReviewKeywordCategoryEntity } from './user-club-review-category.entity'

@Entity('club_review_keyword')
export class ClubReviewKeywordEntity extends TimeStampMixin {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string

  @Column({ type: 'bigint', name: 'category_id' })
  categoryId: number

  @ManyToOne(() => ClubReviewKeywordCategoryEntity, (category) => category.reviewKeywords)
  @JoinColumn({ name: 'category_id' })
  category: ClubReviewKeywordCategoryEntity

  @Column({ type: 'smallint', name: 'sort_order' })
  sortOrder: number

  @Column({ type: 'varchar', length: 64, name: 'title' })
  title: string

  @Column({ type: 'varchar', length: 16, default: '', name: 'color' })
  color: string

  @Column({ type: 'varchar', length: 300, default: '', name: 'icon_uri' })
  iconUri: string
}
