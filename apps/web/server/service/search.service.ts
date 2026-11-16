import { uniqBy } from 'lodash-es'
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

// 주제에서 고른 낱말과, 그 낱말로 찾은 동아리
type KeywordMatch = {
  keywords: string[]
  clubs: SearchClub[]
}

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

    // 1. 검색문에서 모든 동아리에 흔한 낱말을 빼고 주제만 남깁니다.
    // 문장에 적은 조건은 해석하지 않고, URL 필터만 적용합니다.
    const topic = await extractSearchTopic(query)

    // 2. 세 가지 방법으로 함께 찾습니다. 서로를 기다리지 않습니다.
    // 낱말 고르기와 뜻으로 찾기는 같은 임베딩을 함께 기다립니다.
    const [topicClubs, keywordMatch, semanticClubs] = await Promise.all([
      this.searchByText(topic, options),
      this.searchByKeywords(topic, options),
      this.searchByMeaning(topic, options),
    ])

    // 3. 주제가 어느 동아리 글에도 없고 낱말도 고르지 못했으면 오타일 수 있습니다.
    // 그때만 오타를 고친 검색어로 다시 찾습니다.
    const mayBeTypo = topicClubs.length === 0 && keywordMatch.keywords.length === 0
    const topicResult = mayBeTypo ? await this.searchCorrected(topic, options) : asTyped(topicClubs)

    // 4. 주제 전체, 낱말, 뜻의 순서로 잇습니다. 앞에서 나온 동아리는 다시 넣지 않습니다.
    const found = [...topicResult.clubs, ...keywordMatch.clubs, ...semanticClubs]
    const clubs = uniqBy(found, (club) => club.uuid)

    return { ...topicResult, clubs }
  }

  // 검색어가 글에 그대로 있는 동아리를 찾습니다.
  private async searchByText(query: string, options: SearchOptions): Promise<SearchClub[]> {
    const found = await this.searchQueryService.search(query, options.filters)
    const clubs = await this.hydratorService.toClubs(found)

    return this.sortService.sort(clubs, query, options.sort ?? DEFAULT_SEARCH_SORT)
  }

  // 주제의 낱말 가운데 문자열로 찾을 낱말을 고르고, 그 낱말로 찾습니다.
  // 예: "보드게임 하는" → ["보드게임"]
  private async searchByKeywords(topic: string, options: SearchOptions): Promise<KeywordMatch> {
    const keywords = await this.searchSemanticService.findKeywords(topic)

    // 주제 전체와 같은 낱말은 주제 검색이 이미 찾습니다.
    const otherKeywords = keywords.filter((keyword) => keyword !== topic)
    const searches = otherKeywords.map((keyword) => this.searchByText(keyword, options))
    const results = await Promise.all(searches)

    return { keywords, clubs: results.flat() }
  }

  // 뜻이 가까운 동아리를 찾습니다.
  private async searchByMeaning(topic: string, options: SearchOptions): Promise<SearchClub[]> {
    const { filters, minSimilarity } = options
    const found = await this.searchSemanticService.search(topic, filters, minSimilarity)

    return this.hydratorService.toClubs(found)
  }

  // 결과가 없으면 오타를 고친 검색어로 한 번 더 찾습니다.
  private async searchCorrectingTypos(
    query: string,
    options: SearchOptions,
  ): Promise<ClubSearchResponse> {
    const clubs = await this.searchByText(query, options)
    if (clubs.length > 0) {
      return asTyped(clubs)
    }

    return this.searchCorrected(query, options)
  }

  // 오타를 고친 검색어로 찾습니다. 고칠 말이 없거나 고쳐도 결과가 없으면 빈 결과입니다.
  private async searchCorrected(
    query: string,
    options: SearchOptions,
  ): Promise<ClubSearchResponse> {
    const correctedQuery = await this.typoCorrectionService.findCorrectedQuery(query)
    if (!correctedQuery || correctedQuery === query) {
      return asTyped([])
    }

    const clubs = await this.searchByText(correctedQuery, options)
    if (clubs.length === 0) {
      return asTyped([])
    }

    return {
      clubs,
      correctedQuery,
      isTypoCorrected: true,
    }
  }
}

// 검색어를 고치지 않고 찾은 결과입니다.
function asTyped(clubs: SearchClub[]): ClubSearchResponse {
  return {
    clubs,
    correctedQuery: null,
    isTypoCorrected: false,
  }
}
