import { useQuery } from 'react-query'
import type { Club } from '../../server/domain/model/Club'
import { getGuestId } from './guestId'

export type { Club }

export type ClubListResponse = {
  clubs: Club[]
  totalSize: number
}

export type ClubRanking = {
  ranking: number
  clubId: string
  clubName: string
  category: string
}

export type SearchClub = Club & { hasManager: boolean }

export type SearchClubsResponse = {
  clubs: SearchClub[]
  totalSize: number
  query: string
  correctedQuery: string | null
  isTypoCorrected: boolean
}

// 앱 ClubSearchFilters와 동일한 형태
export type ClubSearchFilters = {
  affiliation_types: ('중앙동아리' | '학과/단과대동아리')[]
  is_recruiting?: 'true' | 'false'
  recruit_type?: '정기' | '상시'
  has_membership_fee?: 'true' | 'false'
  has_dongbang?: 'true' | 'false'
  min_activity_period: ('0' | '1' | '2' | '3_plus')[]
}

export const DEFAULT_SEARCH_FILTERS: ClubSearchFilters = {
  affiliation_types: [],
  min_activity_period: [],
}

async function fetchJson<T>(url: string, headers?: Record<string, string>): Promise<T> {
  const res = await fetch(url, { headers })
  if (!res.ok) {
    throw new Error(`${url} failed: ${res.status}`)
  }
  return res.json()
}

export function useLatestClubs() {
  return useQuery(['clubs', 'latest'], () => fetchJson<ClubListResponse>('/api/v2/clubs/latest'), {
    staleTime: Infinity,
    select: (data) => data.clubs,
  })
}

export function useClubsByCategory(category: string | undefined) {
  return useQuery(
    ['clubs', 'category', category],
    () => fetchJson<ClubListResponse>(`/api/v2/clubs?category=${encodeURIComponent(category!)}`),
    { staleTime: Infinity, enabled: !!category, select: (data) => data.clubs },
  )
}

export function useClubRankings(topk = 5) {
  return useQuery(
    ['clubs', 'rankings', topk],
    () =>
      fetchJson<{ rankings: ClubRanking[]; totalSize: number }>(
        `/api/v2/clubs/rankings?topk=${topk}`,
      ),
    { staleTime: Infinity, keepPreviousData: true, select: (data) => data.rankings },
  )
}

export function useRandomRecommendations(enabled: boolean) {
  return useQuery(
    ['clubs', 'recommendations', 'random'],
    () => fetchJson<ClubListResponse>('/api/v2/clubs/recommendations/random'),
    { enabled, staleTime: Infinity, select: (data) => data.clubs },
  )
}

// 앱 createSearchClubsRequest와 동일한 파라미터 조립 규칙
export function buildSearchParams(query: string, filters: ClubSearchFilters): URLSearchParams {
  const params = new URLSearchParams()
  params.append('query', query.toLowerCase().trim())

  if (
    filters.affiliation_types.length === 1 &&
    filters.affiliation_types[0] !== ('전체' as never)
  ) {
    params.append('affiliation_type', filters.affiliation_types[0])
  }
  if (filters.is_recruiting === 'true') params.append('is_recruiting', 'true')
  if (filters.recruit_type) params.append('recruit_type', filters.recruit_type)
  if (filters.has_membership_fee) params.append('has_membership_fee', filters.has_membership_fee)
  if (filters.has_dongbang) params.append('has_dongbang', filters.has_dongbang)
  for (const period of filters.min_activity_period) {
    params.append('min_activity_period', period)
  }
  return params
}

export type ReviewKeyword = {
  id: string
  title: string
  color: string
  iconUri: string
}

export type ReviewKeywordCategory = {
  id: number
  title: string
  color: string
  keywords: ReviewKeyword[]
}

export function useReviewKeywordCategories() {
  return useQuery(
    ['reviewKeywords'],
    () =>
      fetchJson<{ categories: ReviewKeywordCategory[]; totalSize: number }>(
        '/api/v2/clubs/reviews/keywords',
      ),
    { staleTime: Infinity, select: (data) => data.categories },
  )
}

export function useClub(uuid: string | undefined) {
  return useQuery(['clubs', uuid], () => fetchJson<Club>(`/api/v2/clubs/${uuid}`), {
    enabled: !!uuid,
    staleTime: Infinity,
  })
}

export function useSearchClubs(query: string, filters: ClubSearchFilters) {
  const params = buildSearchParams(query, filters)
  return useQuery(
    ['searchClubs', params.toString()],
    () =>
      fetchJson<SearchClubsResponse>(`/api/v2/clubs/search?${params.toString()}`, {
        'x-guest-id': getGuestId(),
      }),
    { enabled: query.trim().length > 0, keepPreviousData: true, staleTime: 0 },
  )
}
