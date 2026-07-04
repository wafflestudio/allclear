import { Club } from '@/entities/club'
import { ReviewKeyword, ReviewKeywordCategory } from '@/entities/review'
import { apiConnector } from '@/shared/utils/api'

export type CreateClubReviewsRequest = {
	uuid: Club['uuid']
	rating?: number // unused
	reviewKeywordIds: ReviewKeyword['id'][]
}

export type ListReviewKeywordsResponse = {
	categories: ReviewKeywordCategory[]
	totalSize: number
}

export type GetMyClubReviewRequest = {
	uuid: Club['uuid']
}

export type GetMyClubReviewResponse = {
	rating: number
	reviewKeywordIds: ReviewKeyword['id'][]
	createdAt: string
	updatedAt: string
} | null

export type ReviewRepository = {
	createClubReviews: (req: CreateClubReviewsRequest) => Promise<void>
	listReviewKeywords: () => Promise<ListReviewKeywordsResponse>
	getMyClubReview: (req: GetMyClubReviewRequest) => Promise<GetMyClubReviewResponse>
}

export const getReviewRepository = (): ReviewRepository => ({
	createClubReviews: async req => {
		await apiConnector.post(`/v2/clubs/${req.uuid}/reviews`, {
			rating: req.rating,
			reviewKeywordIds: req.reviewKeywordIds,
		})
	},
	listReviewKeywords: async () => {
		const response = await apiConnector.get<ListReviewKeywordsResponse>(
			'/v2/clubs/reviews/keywords',
		)

		return response
	},
	getMyClubReview: async req => {
		const response = await apiConnector.get<GetMyClubReviewResponse>(
			`/v2/clubs/${req.uuid}/reviews/me`,
		)

		return response
	},
})
