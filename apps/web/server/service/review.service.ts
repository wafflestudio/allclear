import { Repository } from 'typeorm'
import { Inject, InjectRepository, Service } from '../provider'
import { UserClubReviewEntity } from '../infra/database/entities/user-club-review.entity'
import { ClubReviewKeywordCategoryEntity } from '../infra/database/entities/user-club-review-category.entity'
import { ReviewKeywordCategory } from '../../src/lib/schemas/common'
import { ClubRanking, MyReview } from '../../src/lib/schemas/clubs'
import { ClubAccessService } from './club-access.service'

@Service
export class ReviewService {
  @InjectRepository(ClubReviewKeywordCategoryEntity)
  private readonly clubReviewKeywordCategoryRepository: Repository<ClubReviewKeywordCategoryEntity>
  @InjectRepository(UserClubReviewEntity)
  private readonly userClubReviewRepository: Repository<UserClubReviewEntity>
  @Inject(ClubAccessService)
  private readonly clubAccessService: ClubAccessService

  public async reviewClub(
    serviceUserId: string,
    clubId: string,
    review: { rating?: number; reviewKeywordIds?: string[]; content?: string },
  ) {
    const { rating, reviewKeywordIds, content } = review
    await this.clubAccessService.getPublicClub(clubId)

    const userClubReview = await this.userClubReviewRepository.findOneBy({
      serviceUserId,
      clubId,
    })
    if (userClubReview) {
      userClubReview.rating = rating ?? userClubReview.rating
      userClubReview.reviewKeywordIds = reviewKeywordIds ?? userClubReview.reviewKeywordIds
      userClubReview.content = content ?? userClubReview.content
      await this.userClubReviewRepository.save(userClubReview)
    } else {
      await this.userClubReviewRepository.insert({
        serviceUserId,
        clubId,
        rating,
        reviewKeywordIds,
        content,
      })
    }
  }

  public async getKeywords(): Promise<ReviewKeywordCategory[]> {
    const categories = await this.clubReviewKeywordCategoryRepository.find({
      order: {
        sortOrder: 'ASC',
      },
      relations: ['reviewKeywords'],
    })
    return categories.map((it) => ({
      id: it.id,
      title: it.title,
      color: it.color,
      iconUri: it.iconUri,
      keywords: it.reviewKeywords
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((k) => ({
          id: k.id,
          title: k.title,
          color: k.color,
          iconUri: k.iconUri,
        })),
    }))
  }

  public async getMyReview(serviceUserId: string, clubId: string): Promise<MyReview | null> {
    await this.clubAccessService.getPublicClub(clubId)
    const review = await this.userClubReviewRepository.findOneBy({
      clubId,
      serviceUserId,
    })
    return review
      ? {
          rating: review.rating,
          reviewKeywordIds: review.reviewKeywordIds,
          content: review.content,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt,
        }
      : null
  }

  public async getClubRankings(topk = 5): Promise<ClubRanking[]> {
    const aggregated: {
      club_id: string
      club_name: string
      category: string
    }[] = await this.userClubReviewRepository.query(`
SELECT ucr.club_id, MAX(c.name) AS club_name, MAX(c.category) AS category
FROM user_club_review ucr 
JOIN club c ON ucr.club_id = c.uuid AND c.deleted_at IS NULL AND c.status = 'APPROVED'
GROUP BY ucr.club_id
ORDER BY COUNT(*) DESC 
LIMIT ${topk}
    `)

    return aggregated.map((it, idx) => ({
      clubId: it.club_id,
      clubName: it.club_name,
      category: it.category,
      ranking: idx + 1,
    }))
  }
}
