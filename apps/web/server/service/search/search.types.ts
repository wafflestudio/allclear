import type { Club, ClubDomainSource } from 'server/domain/model/Club'

export type ClubSearchResponse = {
  clubs: SearchClub[]
  correctedQuery: string | null
  isTypoCorrected: boolean
}

export type SearchClub = Club & {
  hasManager: boolean
}

export type MinActivityPeriodFilter = '0' | '1' | '2' | '3_plus'

export type SearchFilters = {
  affiliationType?: string
  isRecruiting?: boolean
  recruitType?: '정기' | '상시'
  hasMembershipFee?: boolean
  hasDongbang?: boolean
  isOfficialVerified?: boolean
  minActivityPeriods?: MinActivityPeriodFilter[]
}

export type SearchSortType = 'default'

export type SearchOptions = {
  filters: SearchFilters
  sort?: SearchSortType
  // AI 검색의 의미 검색 결과는 이 유사도(0~1) 이상만 표시합니다.
  minSimilarity?: number
}

export type SearchMatchedClub = {
  entity: ClubDomainSource
  score?: number
  matchedBy?: 'name' | 'short_description' | 'college_major'
}

export const DEFAULT_SEARCH_SORT: SearchSortType = 'default'
