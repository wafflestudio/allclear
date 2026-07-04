import type {
	ClubSearchAffiliationType,
	ClubSearchBooleanString,
	ClubSearchMinActivityPeriod,
	ClubSearchRecruitType,
	SearchClubsRequest,
} from '@/repositories/club'

type SelectableClubSearchAffiliationType = Exclude<ClubSearchAffiliationType, '전체'>

export type ClubSearchFilters = {
	affiliation_types: SelectableClubSearchAffiliationType[]
	is_recruiting?: ClubSearchBooleanString
	recruit_type?: ClubSearchRecruitType
	has_membership_fee?: ClubSearchBooleanString
	has_dongbang?: ClubSearchBooleanString
	is_official_verified?: ClubSearchBooleanString
	min_activity_period: ClubSearchMinActivityPeriod[]
}

export type ClubSearchForm = {
	query: string
	filters: ClubSearchFilters
}

export const DEFAULT_CLUB_SEARCH_FILTERS: ClubSearchFilters = {
	affiliation_types: [],
	min_activity_period: [],
}

export const DEFAULT_CLUB_SEARCH_FORM: ClubSearchForm = {
	query: '',
	filters: DEFAULT_CLUB_SEARCH_FILTERS,
}

export const normalizeClubSearchFilters = (
	filters: Partial<ClubSearchFilters> | undefined,
): ClubSearchFilters => ({
	...DEFAULT_CLUB_SEARCH_FILTERS,
	...filters,
	affiliation_types: filters?.affiliation_types ?? DEFAULT_CLUB_SEARCH_FILTERS.affiliation_types,
	min_activity_period:
		filters?.min_activity_period ?? DEFAULT_CLUB_SEARCH_FILTERS.min_activity_period,
})

export const resetClubSearchOverlayFilters = (
	filters: Partial<ClubSearchFilters> | undefined,
): ClubSearchFilters => {
	const normalizedFilters = normalizeClubSearchFilters(filters)

	return {
		...normalizedFilters,
		recruit_type: undefined,
		has_membership_fee: undefined,
		has_dongbang: undefined,
		is_official_verified: undefined,
		min_activity_period: DEFAULT_CLUB_SEARCH_FILTERS.min_activity_period,
	}
}

export const createSearchClubsRequest = (form: ClubSearchForm): SearchClubsRequest => {
	const query = form.query.trim()
	const normalizedFilters = normalizeClubSearchFilters(form.filters)
	const { affiliation_types } = normalizedFilters

	const affiliation_type = affiliation_types.length === 1 ? affiliation_types[0] : undefined

	return {
		query,
		affiliation_type,
		is_recruiting: normalizedFilters.is_recruiting,
		recruit_type: normalizedFilters.recruit_type,
		has_membership_fee: normalizedFilters.has_membership_fee,
		has_dongbang: normalizedFilters.has_dongbang,
		is_official_verified: normalizedFilters.is_official_verified,
		min_activity_period:
			normalizedFilters.min_activity_period.length > 0
				? normalizedFilters.min_activity_period
				: undefined,
	}
}
