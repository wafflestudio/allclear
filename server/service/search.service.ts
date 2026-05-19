import { Inject, Service } from '../provider'
import { ClubEntity } from '../infra/database/entities'
import { Club } from 'server/domain/model/Club'
import { SearchQueryService } from './search/search-query.service'
import { SearchTypoCorrectionService } from './search/search-typo-correction.service'
import { SearchResultHydratorService } from './search/search-result-hydrator.service'
import { SearchSortService } from './search/search-sort.service'
import { SearchLogService } from './search/search-log.service'
import {
  ClubSearchResponse,
  DEFAULT_SEARCH_SORT,
  SearchOptions,
} from './search/search.types'

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

  private async runSearch(query: string, options: SearchOptions): Promise<Club[]> {
    const entities: ClubEntity[] = await this.searchQueryService.search(query, options.filters)
    const clubs = await this.hydratorService.toClubs(entities)
    return this.sortService.sort(clubs, options.sort ?? DEFAULT_SEARCH_SORT)
  }
}
