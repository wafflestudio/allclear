import { ClubEntity } from 'server/infra/database/entities'
import { Club } from 'server/domain/model/Club'

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
}

export type SearchMatchedClub = {
  entity: ClubEntity
  score?: number
  matchedBy?: 'name' | 'short_description' | 'college_major'
}

export const DEFAULT_SEARCH_SORT: SearchSortType = 'default'
