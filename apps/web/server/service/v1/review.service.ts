import { In, Repository } from 'typeorm'
import { InjectRepository, Service } from 'server/provider'
import { ClubEntity } from 'server/infra/database/entities'
import { UserClubReviewEntity } from 'server/infra/database/entities/user-club-review.entity'
import { ClubReviewKeywordEntity } from 'server/infra/database/entities/club-review-keyword.entity'
import { ClubReviewKeywordCategoryEntity } from 'server/infra/database/entities/user-club-review-category.entity'
import { ReviewKeywordCategory } from 'pages/api/v1/clubs/reviews/keywords'
import { ClubRanking } from 'pages/api/v1/clubs/rankings'
import { MyReview } from 'pages/api/v1/clubs/[uuid]/reviews/me'

@Service
export class ReviewServiceV1 {
  @InjectRepository(ClubEntity)
  private readonly clubRepository: Repository<ClubEntity>
  @InjectRepository(ClubReviewKeywordEntity)
  private readonly clubReviewKeywordRepository: Repository<ClubReviewKeywordEntity>
  @InjectRepository(ClubReviewKeywordCategoryEntity)
  private readonly clubReviewKeywordCategoryRepository: Repository<ClubReviewKeywordCategoryEntity>
  @InjectRepository(UserClubReviewEntity)
  private readonly userClubReviewRepository: Repository<UserClubReviewEntity>

  public async reviewClub(
    serviceUserId: string,
    clubId: string,
    review: { rating?: number; reviewKeywordIds?: string[]; content?: string },
  ) {
    const { rating, reviewKeywordIds, content } = review
    await this.clubRepository.findOneByOrFail({ uuid: clubId })

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
      total_reviews: string
      rating: string
      club_name: string
      club_full_name: string
    }[] = await this.userClubReviewRepository.query(`
SELECT ucr.club_id, COUNT(ucr.id) AS total_reviews, COALESCE(AVG(ucr.rating), 0) AS rating, MAX(c.name) AS club_name, MAX(c.full_name) AS club_full_name 
FROM user_club_review ucr 
JOIN club c ON ucr.club_id = c.uuid AND c.deleted_at IS NULL    
GROUP BY club_id 
ORDER BY COUNT(*) DESC 
LIMIT ${topk}
    `)
    if (!aggregated.length) {
      return []
    }
    const reviews = await this.userClubReviewRepository.findBy({
      clubId: In(aggregated.map((it) => it.club_id)),
    })
    return Promise.all(
      aggregated.map(async (it, idx) => {
        const totalKeywords = reviews
          .filter((r) => it.club_id === r.clubId)
          .flatMap((r) => r.reviewKeywordIds)
        const keywordIds = this.mostFrequent(totalKeywords, 3)
        const keyword = await this.clubReviewKeywordRepository.findBy({ id: In(keywordIds) })
        const keywordTitles = keywordIds
          .map((it) => keyword.find((k) => k.id === it)?.title ?? '')
          .filter((it) => it)
        return {
          clubId: it.club_id,
          clubName: it.club_name,
          clubFullName: it.club_full_name,
          totalReviews: Number(it.total_reviews),
          rating: Number(it.rating),
          ranking: idx + 1,
          keywords: keywordTitles,
        }
      }),
    )
  }

  private mostFrequent(input: string[], topN = 3): string[] {
    const frequencyMap = input.reduce((acc, cur) => {
      acc[cur] = (acc[cur] ?? 0) + 1
      return acc
    }, {} as { [key: string]: number })
    return Array.from(new Set(input))
      .map((key): [string, number] => [key, frequencyMap[key]])
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map((it) => it[0])
  }
}
