import { Category } from '@/entities/category'

export type Club = {
	id: string
	uuid: string // id와 동일한 필드. 기존의 id는 number 타입이었으나, string 타입으로 변경되었다.
	name: string
	fullName: string
	description: string
	introduction: string
	type: string
	category: Category['name']
	college: string
	recruitType: string
	isPopular: boolean
	hasDongbang: boolean
	activityCycle: string
	membershipFee: string
	tags: string[]
	imageUri: string
	article: string
	articleUploadedAt: string | null
	// v240121
	avgRating: number
	reviewKeywords: ReviewKeyword[]
	// v240218
	totalReviews: number
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
