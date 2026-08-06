import { z } from 'src/lib/schemas/zod'
import { ClubCategorySchema, ClubSchema, ReviewKeywordCategorySchema } from 'src/lib/schemas/common'

export const ClubUuidParamsSchema = z
  .object({
    uuid: z.string().uuid(),
  })
  .openapi('ClubUuidParams')

export const ClubListByCategoryQuerySchema = z
  .object({
    category: z.string(),
  })
  .openapi('ClubListByCategoryQuery')

export const MinActivityPeriodFilterSchema = z.enum(['0', '1', '2', '3_plus'])

export const ClubSearchQuerySchema = z
  .object({
    query: z.string(),
    affiliation_type: z.enum(['전체', '중앙동아리', '학과/단과대동아리']).optional(),
    is_recruiting: z.string().optional(),
    recruit_type: z.enum(['정기', '상시']).optional(),
    has_membership_fee: z.string().optional(),
    has_dongbang: z.string().optional(),
    is_official_verified: z.string().optional(),
    min_activity_period: z
      .union([MinActivityPeriodFilterSchema, z.array(MinActivityPeriodFilterSchema)])
      .optional(),
  })
  .openapi('ClubSearchQuery')

export const UpdateClubReviewSchema = z
  .object({
    rating: z.number().min(0).max(5).optional(),
    reviewKeywordIds: z.array(z.string().uuid()).optional(),
    content: z.string().trim().nonempty().max(100).optional(),
  })
  .openapi('UpdateClubReview')

export const MyReviewSchema = z
  .object({
    rating: z.number(),
    reviewKeywordIds: z.array(z.string().uuid()),
    content: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi('MyReview')

export type MyReview = z.infer<typeof MyReviewSchema>

export const ClubRankingsQuerySchema = z
  .object({
    topk: z
      .preprocess((d) => parseInt(d as string, 10), z.number().int().positive().min(1).max(20))
      .optional(),
  })
  .openapi('ClubRankingsQuery')

export const ClubRankingSchema = z
  .object({
    ranking: z.number().int(),
    clubId: z.string().uuid(),
    clubName: z.string(),
    category: z.string(),
  })
  .openapi('ClubRanking')

export type ClubRanking = z.infer<typeof ClubRankingSchema>

export const ClubsResponseSchema = z
  .object({
    clubs: z.array(ClubSchema),
    totalSize: z.number().int(),
  })
  .openapi('ClubsResponse')

export const SearchClubSchema = ClubSchema.extend({
  hasManager: z.boolean(),
}).openapi('SearchClub')

export const ClubsSearchResponseSchema = z
  .object({
    clubs: z.array(SearchClubSchema),
    totalSize: z.number().int(),
    query: z.string(),
    correctedQuery: z.string().nullable(),
    isTypoCorrected: z.boolean(),
  })
  .openapi('ClubsSearchResponse')

export const ClubCategoriesResponseSchema = z
  .object({
    categories: z.array(ClubCategorySchema),
    totalSize: z.number().int(),
  })
  .openapi('ClubCategoriesResponse')

export const ReviewKeywordCategoriesResponseSchema = z
  .object({
    categories: z.array(ReviewKeywordCategorySchema),
    totalSize: z.number().int(),
  })
  .openapi('ReviewKeywordCategoriesResponse')

export const ClubRankingsResponseSchema = z
  .object({
    rankings: z.array(ClubRankingSchema),
    totalSize: z.number().int(),
  })
  .openapi('ClubRankingsResponse')
