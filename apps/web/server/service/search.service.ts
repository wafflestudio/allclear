import { isUndefined, omitBy } from 'lodash-es'
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
import { SearchSemanticService } from './search/search-semantic.service'
import { SearchSortService } from './search/search-sort.service'
import { SearchTypoCorrectionService } from './search/search-typo-correction.service'

@Service
export class SearchService {
  @Inject(SearchQueryService)
  private readonly searchQueryService: SearchQueryService

  @Inject(SearchSemanticService)
  private readonly searchSemanticService: SearchSemanticService

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

    return this.searchCorrectingTypos(query, options)
  }

  async searchWithAi(
    query: string,
    options: SearchOptions = { filters: {} },
  ): Promise<ClubSearchResponse> {
    this.searchLogService.logSearch(query)

    // 1. 문장을 검색 주제와 조건으로 나눕니다.
    const intent = await interpretSearchQuery(query)
    const topic = intent.searchQuery

    // URL에 명시한 필터가 문장에서 추출한 조건보다 우선합니다.
    const urlFilters = omitBy(options.filters, isUndefined)
    const filters = { ...intent.filters, ...urlFilters }
    const searchOptions = { ...options, filters }

    // 2. 문자열 검색과 의미 검색을 함께 실행합니다.
    // 의도 변환은 오타 교정이 아닙니다. 모델이 바꾼 검색문은 다시 교정하지 않습니다.
    const isRewritten = topic !== query
    const keywordSearch = isRewritten
      ? this.searchWithoutCorrection(topic, searchOptions)
      : this.searchCorrectingTypos(topic, searchOptions)

    const semanticSearch = this.searchSemanticService.search(topic, filters, options.minSimilarity)

    const [keywordResult, semanticEntities] = await Promise.all([keywordSearch, semanticSearch])

    // 3. 문자열 일치 결과 뒤에 의미 검색 결과를 붙입니다.
    const clubs = await this.appendSemantic(keywordResult.clubs, semanticEntities)

    return { ...keywordResult, clubs }
  }

  // 결과가 없으면 오타를 고친 검색어로 한 번 더 찾습니다.
  private async searchCorrectingTypos(
    query: string,
    options: SearchOptions,
  ): Promise<ClubSearchResponse> {
    const clubs = await this.runSearch(query, options)
    if (clubs.length > 0) {
      return {
        clubs,
        correctedQuery: null,
        isTypoCorrected: false,
      }
    }

    const correctedQuery = await this.typoCorrectionService.findCorrectedQuery(query)
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

  private async searchWithoutCorrection(
    query: string,
    options: SearchOptions,
  ): Promise<ClubSearchResponse> {
    const clubs = await this.runSearch(query, options)

    return {
      clubs,
      correctedQuery: null,
      isTypoCorrected: false,
    }
  }

  // 이미 문자열로 찾은 동아리는 빼고, 유사도순 그대로 뒤에 붙입니다.
  private async appendSemantic(
    clubs: SearchClub[],
    semanticEntities: ClubDomainSource[],
  ): Promise<SearchClub[]> {
    const matched = new Set(clubs.map((club) => club.uuid))
    const additional = semanticEntities.filter((club) => !matched.has(club.uuid))
    const additionalClubs = await this.hydratorService.toClubs(additional)

    return [...clubs, ...additionalClubs]
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
