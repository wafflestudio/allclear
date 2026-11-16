import type { NextApiRequest } from 'next'
import { BadRequestError } from 'server/domain/error'
import type { MinActivityPeriodFilter, SearchFilters } from 'server/service/search/search.types'

type QueryString = NextApiRequest['query']

export type SearchRequest = {
  query: string
  filters: SearchFilters
  recordRecentSearch: boolean
}

const MAX_QUERY_LENGTH = 200

const INVALID_FILTER_MESSAGE = 'invalid search filter'

const MIN_ACTIVITY_PERIOD_FILTERS = new Set<MinActivityPeriodFilter>(['0', '1', '2', '3_plus'])

// 두 검색 API가 함께 받는 값을 읽습니다. 잘못된 값은 BadRequestError(400)가 됩니다.
export function parseSearchRequest(params: QueryString): SearchRequest {
  return {
    query: parseQuery(params.query),
    filters: parseSearchFilters(params),
    recordRecentSearch: parseOptionalBoolean(params.record_recent_search) ?? true,
  }
}

// AI 검색만 받는 값입니다. 의미 검색 결과의 최소 유사도이며 0~1 사이여야 합니다.
export function parseMinSimilarity(value: unknown): number | undefined {
  if (value === undefined) {
    return undefined
  }
  if (typeof value !== 'string' || value.trim() === '') {
    throw new BadRequestError(INVALID_FILTER_MESSAGE)
  }

  const similarity = Number(value)
  if (Number.isNaN(similarity) || similarity < 0 || similarity > 1) {
    throw new BadRequestError(INVALID_FILTER_MESSAGE)
  }
  return similarity
}

function parseQuery(value: unknown): string {
  const query = typeof value === 'string' ? value.trim() : ''

  if (query === '') {
    throw new BadRequestError('query is required')
  }
  if (query.length > MAX_QUERY_LENGTH) {
    throw new BadRequestError(`query must be ${MAX_QUERY_LENGTH} characters or fewer`)
  }
  return query
}

function parseSearchFilters(params: QueryString): SearchFilters {
  return {
    affiliationType: parseAffiliationType(params.affiliation_type),
    isRecruiting: parseOptionalBoolean(params.is_recruiting),
    recruitType: parseRecruitType(params.recruit_type),
    hasMembershipFee: parseOptionalBoolean(params.has_membership_fee),
    hasDongbang: parseOptionalBoolean(params.has_dongbang),
    isOfficialVerified: parseOptionalBoolean(params.is_official_verified),
    minActivityPeriods: parseMinActivityPeriods(params.min_activity_period),
  }
}

function parseOptionalBoolean(value: unknown): boolean | undefined {
  if (value === undefined) {
    return undefined
  }
  if (value === 'true') {
    return true
  }
  if (value === 'false') {
    return false
  }
  throw new BadRequestError(INVALID_FILTER_MESSAGE)
}

function parseAffiliationType(value: unknown): string | undefined {
  if (value === undefined || value === '전체') {
    return undefined
  }
  if (value === '중앙동아리') {
    return '중앙동아리'
  }
  if (value === '학과/단과대동아리') {
    return '소속동아리'
  }
  throw new BadRequestError(INVALID_FILTER_MESSAGE)
}

function parseRecruitType(value: unknown): '정기' | '상시' | undefined {
  if (value === undefined) {
    return undefined
  }
  if (value === '정기' || value === '상시') {
    return value
  }
  throw new BadRequestError(INVALID_FILTER_MESSAGE)
}

function parseMinActivityPeriods(value: unknown): MinActivityPeriodFilter[] | undefined {
  if (value === undefined) {
    return undefined
  }

  const values = Array.isArray(value) ? value : [value]
  const selected = values.map((it) => {
    if (typeof it !== 'string' || !MIN_ACTIVITY_PERIOD_FILTERS.has(it as MinActivityPeriodFilter)) {
      throw new BadRequestError(INVALID_FILTER_MESSAGE)
    }
    return it as MinActivityPeriodFilter
  })

  const unique = Array.from(new Set(selected))
  if (unique.length === 0) {
    return undefined
  }
  return unique
}
