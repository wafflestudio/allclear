import { NextApiRequest, NextApiResponse } from 'next'
import { Provider } from 'server/provider'
import { SearchService } from 'server/service/search.service'
import {
  MinActivityPeriodFilter,
  SearchClub,
  SearchFilters,
} from 'server/service/search/search.types'
import { BadRequestError, UnauthorizedError } from 'server/domain/error'
import { saveRecentSearchBestEffort } from 'server/service/recent-search.service'
import { resolveOptionalAuth } from 'server/util/optional-auth'

type ResponseData = {
  clubs: SearchClub[]
  totalSize: number
  query: string
  correctedQuery: string | null
  isTypoCorrected: boolean
}

const INVALID_FILTER_MESSAGE = 'invalid search filter'

const MIN_ACTIVITY_PERIOD_FILTERS = new Set<MinActivityPeriodFilter>(['0', '1', '2', '3_plus'])

class InvalidSearchFilterError extends Error {}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | string>,
) {
  try {
    const searchService = Provider.getService(SearchService)

    if (req.method == 'GET') {
      const auth = await resolveOptionalAuth(req)
      const query = req.query.query as string
      if (!query) {
        return res.status(400).send('query is required')
      }

      let filters: SearchFilters
      try {
        filters = parseSearchFilters(req.query)
      } catch (err) {
        if (err instanceof InvalidSearchFilterError) {
          return res.status(400).send(err.message)
        }
        throw err
      }

      const { clubs, correctedQuery, isTypoCorrected } =
        await searchService.searchWithTypoCorrection(query, { filters })
      await saveRecentSearchBestEffort(auth, query)
      return res.status(200).json({
        clubs: clubs,
        totalSize: clubs.length,
        query,
        correctedQuery,
        isTypoCorrected,
      })
    }
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return res.status(401).send('unauthorized')
    }
    if (err instanceof BadRequestError) {
      return res.status(400).send(err.message)
    }
    console.error('searchClubs error: ', err)
    return res.status(500).send('Internal Server Error')
  }
}

function parseSearchFilters(query: NextApiRequest['query']): SearchFilters {
  return {
    affiliationType: parseAffiliationType(query.affiliation_type),
    isRecruiting: parseOptionalBoolean(query.is_recruiting),
    recruitType: parseRecruitType(query.recruit_type),
    hasMembershipFee: parseOptionalBoolean(query.has_membership_fee),
    hasDongbang: parseOptionalBoolean(query.has_dongbang),
    isOfficialVerified: parseOptionalBoolean(query.is_official_verified),
    minActivityPeriods: parseMinActivityPeriods(query.min_activity_period),
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
  throw new InvalidSearchFilterError(INVALID_FILTER_MESSAGE)
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
  throw new InvalidSearchFilterError(INVALID_FILTER_MESSAGE)
}

function parseRecruitType(value: unknown): '정기' | '상시' | undefined {
  if (value === undefined) {
    return undefined
  }
  if (value === '정기' || value === '상시') {
    return value
  }
  throw new InvalidSearchFilterError(INVALID_FILTER_MESSAGE)
}

function parseMinActivityPeriods(value: unknown): MinActivityPeriodFilter[] | undefined {
  if (value === undefined) {
    return undefined
  }

  const values = Array.isArray(value) ? value : [value]
  const selected = values.map((it) => {
    if (typeof it !== 'string' || !MIN_ACTIVITY_PERIOD_FILTERS.has(it as MinActivityPeriodFilter)) {
      throw new InvalidSearchFilterError(INVALID_FILTER_MESSAGE)
    }
    return it as MinActivityPeriodFilter
  })

  const unique = Array.from(new Set(selected))
  if (unique.length === 0) {
    return undefined
  }
  return unique
}
