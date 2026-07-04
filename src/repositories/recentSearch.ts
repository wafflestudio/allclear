import { RecentSearch } from '@/entities/recentSearch'
import { apiConnector } from '@/shared/utils/api'

export type ListRecentSearchesResponse = {
	recentSearches: RecentSearch[]
	totalSize: number
}

export type RecentSearchRepository = {
	listRecentSearches: () => Promise<ListRecentSearchesResponse>
	deleteAllRecentSearches: () => Promise<void>
}

export const getRecentSearchRepository = (): RecentSearchRepository => ({
	listRecentSearches: async () => {
		const response = await apiConnector.get<ListRecentSearchesResponse>(
			'/v2/users/me/recent-searches',
		)
		return response
	},
	deleteAllRecentSearches: async () => {
		await apiConnector.delete<void>('/v2/users/me/recent-searches')
	},
})
