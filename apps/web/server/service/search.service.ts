import type { ClubDomainSource } from '../domain/model/Club'
import { Inject, Service } from '../provider'
import {
  type ClubSearchResponse,
  DEFAULT_SEARCH_SORT,
  type SearchClub,
  type SearchOptions,
} from './search/search.types'
import { interpretSearchQuery } from './search/search-intent'
import { SearchLogService } from './search/search-log.service'
import { SearchQueryService } from './search/search-query.service'
import { SearchResultHydratorService } from './search/search-result-hydrator.service'
import { SearchSortService } from './search/search-sort.service'
import { SearchTypoCorrectionService } from './search/search-typo-correction.service'

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
    return this.searchKeywords(query, options)
  }

  async searchWithAi(
    query: string,
    options: SearchOptions = { filters: {} },
  ): Promise<ClubSearchResponse> {
    this.searchLogService.logSearch(query)
    const intent = await interpretSearchQuery(query)
    // URL에 명시한 필터가 문장에서 추출한 조건보다 우선합니다.
    const selectedFilters = Object.fromEntries(
      Object.entries(options.filters).filter(([, value]) => value !== undefined),
    )
    const searchOptions = {
      ...options,
      filters: { ...intent.filters, ...selectedFilters },
    }

    const [result, semanticEntities] = await Promise.all([
      // 의도 변환은 오타 교정이 아닙니다. 모델이 만든 검색문은 다시 교정하지 않습니다.
      this.searchKeywords(intent.searchQuery, searchOptions, intent.searchQuery === query),
      this.searchQueryService.searchSemantic(intent.searchQuery, searchOptions.filters),
    ])
    return {
      ...result,
      clubs: await this.appendSemantic(result.clubs, semanticEntities),
    }
  }

  private async searchKeywords(
    query: string,
    options: SearchOptions,
    correctTypos = true,
  ): Promise<ClubSearchResponse> {
    const clubs = await this.runSearch(query, options)
    if (clubs.length > 0) {
      return {
        clubs,
        correctedQuery: null,
        isTypoCorrected: false,
      }
    }

    const correctedQuery = correctTypos
      ? await this.typoCorrectionService.findCorrectedQuery(query)
      : null
    if (correctedQuery && correctedQuery !== query) {
      const correctedClubs = await this.runSearch(correctedQuery, options)
      if (correctedClubs.length > 0) {
        return {
          clubs: correctedClubs,
          correctedQuery,
          isTypoCorrected: true,
        }
      }
    }

    return {
      clubs: [],
      correctedQuery: null,
      isTypoCorrected: false,
    }
  }

  private async appendSemantic(
    clubs: SearchClub[],
    entities: ClubDomainSource[],
  ): Promise<SearchClub[]> {
    const matched = new Set(clubs.map((club) => club.uuid))
    const additional = entities.filter((club) => !matched.has(club.uuid))
    // 문자열 일치 결과 뒤에 의미 검색 결과를 거리순으로 붙입니다.
    return [...clubs, ...(await this.hydratorService.toClubs(additional))]
  }

  private async runSearch(query: string, options: SearchOptions): Promise<SearchClub[]> {
    const entities: ClubDomainSource[] = await this.searchQueryService.search(
      query,
      options.filters,
    )
    const clubs = await this.hydratorService.toClubs(entities)
    return this.sortService.sort(clubs, query, options.sort ?? DEFAULT_SEARCH_SORT)
  }
}
