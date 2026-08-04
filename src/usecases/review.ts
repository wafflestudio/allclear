import type {
	CreateClubReviewsRequest,
	GetMyClubReviewRequest,
	GetMyClubReviewResponse,
	ListReviewKeywordsResponse,
	ReviewRepository,
} from "@/repositories/review";

export type ReviewService = {
	createClubReviews: (req: CreateClubReviewsRequest) => Promise<void>;
	listReviewKeywords: () => Promise<ListReviewKeywordsResponse>;
	getMyClubReview: (
		req: GetMyClubReviewRequest,
	) => Promise<GetMyClubReviewResponse>;
};

type Deps = {
	repositories: [ReviewRepository];
};

export const getReviewService = ({ repositories }: Deps): ReviewService => ({
	createClubReviews: (req) => repositories[0].createClubReviews(req),
	listReviewKeywords: () => repositories[0].listReviewKeywords(),
	getMyClubReview: (req) => repositories[0].getMyClubReview(req),
});
