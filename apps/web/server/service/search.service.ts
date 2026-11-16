import { uniqBy } from 'lodash-es'
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
import { SearchSemanticService } from './search/search-semantic.service'
import { SearchSortService } from './search/search-sort.service'
import { extractSearchTopic } from './search/search-topic'
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
    const { filters, minSimilarity } = options

    // 1. 검색문에서 모든 동아리에 흔한 낱말을 빼고 주제만 남깁니다.
    // 문장에 적은 조건은 해석하지 않고, URL 필터만 적용합니다.
    const topic = await extractSearchTopic(query)

    // 2. 뜻으로 찾기를 시작해 둡니다. 3번이 같은 임베딩을 함께 기다립니다.
    const semanticSearch = this.searchSemanticService.search(topic, filters, minSimilarity)

    // 3. 주제의 낱말 가운데 문자열로 찾을 낱말을 고릅니다. 예: "보드게임 하는" → ["보드게임"]
    const keywords = await this.searchSemanticService.findKeywords(topic)
    // 주제 전체와 같은 낱말은 아래에서 이미 찾습니다.
    const otherKeywords = keywords.filter((keyword) => keyword !== topic)

    // 4. 주제 전체로, 고른 낱말로 문자열 검색을 합니다.
    // 낱말이 동아리 글에 있으면 오타가 아닙니다. 낱말을 하나도 고르지 못했을 때만 오타를 고쳐 봅니다.
    const topicSearch =
      keywords.length > 0
        ? this.searchAsTyped(topic, options)
        : this.searchCorrectingTypos(topic, options)
    const keywordSearches = otherKeywords.map((keyword) => this.runSearch(keyword, options))

    const [topicResult, keywordResults, semanticEntities] = await Promise.all([
      topicSearch,
      Promise.all(keywordSearches),
      semanticSearch,
    ])
    const semanticClubs = await this.hydratorService.toClubs(semanticEntities)

    // 5. 주제 전체, 낱말, 뜻의 순서로 잇습니다. 앞에서 나온 동아리는 다시 넣지 않습니다.
    const found = [...topicResult.clubs, ...keywordResults.flat(), ...semanticClubs]
    const clubs = uniqBy(found, (club) => club.uuid)

    return { ...topicResult, clubs }
  }

  private async searchAsTyped(query: string, options: SearchOptions): Promise<ClubSearchResponse> {
    const clubs = await this.runSearch(query, options)

    return {
      clubs,
      correctedQuery: null,
      isTypoCorrected: false,
    }
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

  private async runSearch(query: string, options: SearchOptions): Promise<SearchClub[]> {
    const entities: ClubDomainSource[] = await this.searchQueryService.search(
      query,
      options.filters,
    )
    const clubs = await this.hydratorService.toClubs(entities)
    return this.sortService.sort(clubs, query, options.sort ?? DEFAULT_SEARCH_SORT)
  }
}
