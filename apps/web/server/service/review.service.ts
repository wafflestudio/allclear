import type { ClubRanking, MyReview } from '../../server/http/schemas/clubs'
import type { ReviewKeywordCategory } from '../../server/http/schemas/common'
import { getPrismaClient } from '../infra/database/prisma'
import { toTimestampString } from '../infra/database/prisma-mapping'
import { Inject, Service } from '../provider'
import { ClubAccessService } from './club-access.service'

@Service
export class ReviewService {
  @Inject(ClubAccessService)
  private readonly clubAccessService: ClubAccessService

  public async reviewClub(
    serviceUserId: string,
    clubId: string,
    review: { reviewKeywordIds?: string[] },
  ) {
    const { reviewKeywordIds } = review
    await this.clubAccessService.getPublicClub(clubId)

    const prisma = getPrismaClient()
    const where = {
      club_id_service_user_id: { club_id: clubId, service_user_id: serviceUserId },
    }
    const userClubReview = await prisma.user_club_review.findUnique({
      where,
    })
    if (userClubReview) {
      if (
        reviewKeywordIds &&
        (reviewKeywordIds.length !== userClubReview.review_keyword_ids.length ||
          reviewKeywordIds.some((id, index) => id !== userClubReview.review_keyword_ids[index]))
      ) {
        await prisma.user_club_review.update({
          where,
          data: { review_keyword_ids: reviewKeywordIds, updated_at: new Date() },
        })
      }
    } else {
      await prisma.user_club_review.create({
        data: {
          service_user_id: serviceUserId,
          club_id: clubId,
          review_keyword_ids: reviewKeywordIds ?? [],
        },
      })
    }
  }

  public async getKeywords(): Promise<ReviewKeywordCategory[]> {
    const prisma = getPrismaClient()
    const categories = await prisma.club_review_keyword_category.findMany({
      where: { deleted_at: null },
      orderBy: { sort_order: 'asc' },
    })
    if (categories.length === 0) {
      return []
    }

    const keywords = await prisma.club_review_keyword.findMany({
      where: {
        category_id: { in: categories.map((category) => category.id) },
        deleted_at: null,
      },
      orderBy: { sort_order: 'asc' },
    })
    const keywordsByCategory = new Map<bigint, ReviewKeywordCategory['keywords']>()
    for (const keyword of keywords) {
      const group = keywordsByCategory.get(keyword.category_id) ?? []
      group.push({ id: keyword.id, title: keyword.title, iconUri: keyword.icon_uri })
      keywordsByCategory.set(keyword.category_id, group)
    }

    return categories.map((it) => ({
      id: this.toCategoryIdNumber(it.id),
      title: it.title,
      keywords: keywordsByCategory.get(it.id) ?? [],
    }))
  }

  public async getMyReview(serviceUserId: string, clubId: string): Promise<MyReview | null> {
    await this.clubAccessService.getPublicClub(clubId)
    const review = await getPrismaClient().user_club_review.findUnique({
      where: {
        club_id_service_user_id: { club_id: clubId, service_user_id: serviceUserId },
      },
    })
    return review
      ? {
          reviewKeywordIds: review.review_keyword_ids,
          createdAt: toTimestampString(review.created_at),
          updatedAt: toTimestampString(review.updated_at),
        }
      : null
  }

  public async getClubRankings(topk = 5): Promise<ClubRanking[]> {
    const aggregated = await getPrismaClient().$queryRaw<
      Array<{
        club_id: string
        club_name: string
        category: string
      }>
    >`
SELECT ucr.club_id, MAX(c.name) AS club_name, MAX(c.category) AS category
FROM user_club_review ucr 
JOIN club c ON ucr.club_id = c.uuid AND c.deleted_at IS NULL AND c.status = 'APPROVED'
GROUP BY ucr.club_id
ORDER BY COUNT(*) DESC 
LIMIT ${topk}
    `

    return aggregated.map((it, idx) => ({
      clubId: it.club_id,
      clubName: it.club_name,
      category: it.category,
      ranking: idx + 1,
    }))
  }

  private toCategoryIdNumber(id: bigint): number {
    const value = Number(id)
    if (!Number.isSafeInteger(value)) {
      throw new RangeError('review keyword category id exceeds the safe integer range')
    }
    return value
  }
}
