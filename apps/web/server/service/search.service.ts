import type { ClubDomainSource } from '../domain/model/Club'
import { Inject, Service } from '../provider'
import {
  type ClubSearchResponse,
  DEFAULT_SEARCH_SORT,
  type SearchClub,
  type SearchOptions,
} from './search/search.types'
import { SearchLogService } from './search/search-log.service'
import { SearchQueryService } from './search/search-query.service'
import { SearchResultHydratorService } from './search/search-result-hydrator.service'
import { SearchSortService } from './search/search-sort.service'
import { SearchTypoCorrectionService } from './search/search-typo-correction.service'

const IGNORED_SEARCH_TERMS = new Set(['서울대', '서울대학교', '동아리'])

function removeIgnoredSearchTerms(query: string): string {
  const terms = query.trim().split(/\s+/)
  if (!terms.some((term) => IGNORED_SEARCH_TERMS.has(term))) {
    return query
  }
  return terms.filter((term) => !IGNORED_SEARCH_TERMS.has(term)).join(' ')
}

function replaceHakgwaSuffix(query: string): string {
  const terms = query.trim().split(/\s+/)
  if (!terms.some((term) => term.length > 2 && term.endsWith('학과'))) {
    return query
  }
  return terms
    .map((term) => (term.length > 2 && term.endsWith('학과') ? term.slice(0, -1) : term))
    .join(' ')
}

@Service
export class SearchService {
  @Inject(SearchQueryService)
  private readonly searchQueryService: SearchQueryService

  @Inject(SearchTypoCorrectionService)
  private readonly typoCorrectionService: SearchTypoCorrectionService

  @Inject(SearchResultHydratorService)
  private readonly hydratorService: SearchResultHydratorService

  @Inject(SearchSortService)
  private readonly sortService: SearchSortService

  @Inject(SearchLogService)
  private readonly searchLogService: SearchLogService

  async searchWithTypoCorrection(
    query: string,
    options: SearchOptions = { filters: {} },
  ): Promise<ClubSearchResponse> {
    this.searchLogService.logSearch(query)
    const searchQuery = removeIgnoredSearchTerms(query)
    if (!searchQuery.trim()) {
      return { clubs: [], correctedQuery: null, isTypoCorrected: false }
    }

    const variantQuery = replaceHakgwaSuffix(searchQuery)
    const hasVariant = variantQuery !== searchQuery
    const [exactClubs, termClubs, variantExactClubs, variantTermClubs] = await Promise.all([
      this.runSearch(searchQuery, options),
      /\s/.test(searchQuery.trim()) ? this.runTermSearch(searchQuery, options) : Promise.resolve([]),
      hasVariant ? this.runSearch(variantQuery, options) : Promise.resolve([]),
      hasVariant && /\s/.test(variantQuery.trim())
        ? this.runTermSearch(variantQuery, options)
        : Promise.resolve([]),
    ])
    const clubs = this.mergeClubs(
      [...exactClubs, ...termClubs],
      [...variantExactClubs, ...variantTermClubs],
      searchQuery,
      options,
    )
    if (exactClubs.length > 0) {
      return {
        clubs,
        correctedQuery: null,
        isTypoCorrected: false,
      }
    }

    const correctedQuery = await this.typoCorrectionService.findCorrectedQuery(searchQuery)
    if (correctedQuery && correctedQuery !== searchQuery) {
      const correctedClubs = await this.runSearch(correctedQuery, options)
      if (correctedClubs.length > 0) {
        return {
          clubs: this.mergeClubs(clubs, correctedClubs, searchQuery, options),
          correctedQuery,
          isTypoCorrected: true,
        }
      }
    }

    return {
      clubs,
      correctedQuery: null,
      isTypoCorrected: false,
    }
  }

  private async runSearch(query: string, options: SearchOptions): Promise<SearchClub[]> {
    const entities: ClubDomainSource[] = await this.searchQueryService.search(
      query,
      options.filters,
    )
    const clubs = await this.hydratorService.toClubs(entities)
    return this.sortService.sort(clubs, query, options.sort ?? DEFAULT_SEARCH_SORT)
  }

  private async runTermSearch(query: string, options: SearchOptions): Promise<SearchClub[]> {
    const entities = await this.searchQueryService.searchTerms(query, options.filters)
    return this.hydratorService.toClubs(entities)
  }

  private mergeClubs(
    first: SearchClub[],
    second: SearchClub[],
    query: string,
    options: SearchOptions,
  ): SearchClub[] {
    const unique = new Map([...first, ...second].map((club) => [club.uuid, club]))
    return this.sortService.sort([...unique.values()], query, options.sort ?? DEFAULT_SEARCH_SORT)
  }
}
