import { ListRecentSearchesResponse, RecentSearchRepository } from '@/repositories/recentSearch'

export type RecentSearchService = {
	listRecentSearches: () => Promise<ListRecentSearchesResponse>
	deleteAllRecentSearches: () => Promise<void>
}

type Deps = {
	repositories: [RecentSearchRepository]
}

export const getRecentSearchService = ({ repositories }: Deps): RecentSearchService => ({
	listRecentSearches: () => repositories[0].listRecentSearches(),
	deleteAllRecentSearches: () => repositories[0].deleteAllRecentSearches(),
})
