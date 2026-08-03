import { Category } from '@/entities/category'

export type ClubCollegeMajor = {
	id: number
	college: string
	major: string
}

export type OfficialVerificationStatus = 'VERIFIED' | 'PENDING' | 'UNVERIFIED'

export type Club = {
	id: string
	uuid: string // id와 동일한 필드. 기존의 id는 number 타입이었으나, string 타입으로 변경되었다.
	name: string
	fullName: string
	description: string
	shortDescription?: string
	introduction: string
	type: string
	affiliationType?: string
	category: Category['name']
	college: string
	collegeMajorId?: number
	collegeMajor?: ClubCollegeMajor | null
	recruitType: string
	isPopular: boolean
	hasManager: boolean
	hasDongbang: boolean
	dongbangLocation?: string | null
	minActivityPeriod?: number | null
	activityCycle: string
	membershipFee: string
	tags: string[]
	imageUri: string
	snsUrls?: string[]
	article: string
	articleUploadedAt: string | null
	activeMemberCount?: number
	foundedAt?: string | null
	activityImageUrls?: string[]
	blurHash?: string | null
	status?: string
	rejectReason?: string | null
	isOfficialVerified?: boolean
	officialVerificationStatus?: OfficialVerificationStatus
	verifiedAt?: string | null
	// v240121
	avgRating: number
	reviewKeywords: ReviewKeyword[]
	// v240218
	totalReviews: number
}

export type ManagedClubManagementStatus =
	| 'APPROVED'
	| 'REJECTED'
	| 'PENDING'
	| 'MANAGER_REQUEST_PENDING'
	| 'MANAGER_REQUEST_REJECTED'

export type ManagedClubListItem = Club & {
	managementStatus: ManagedClubManagementStatus
	managerRequestId?: number
}

type ReviewKeyword = {
	id: string
	title: string
	color: string
	iconUri: string
	totalUpvotes: number
}

export type ClubRanking = {
	ranking: number
	clubId: Club['uuid']
	clubName: Club['name']
	category: Club['category']
}
