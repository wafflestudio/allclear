import { beforeEach, expect, it, vi } from 'vitest'

const { interpretSearchQuery } = vi.hoisted(() => ({
  interpretSearchQuery: vi.fn(),
}))

vi.mock('server/provider', () => ({ Service: () => undefined, Inject: () => () => undefined }))
vi.mock('server/infra/database/prisma', () => ({ getPrismaClient: () => ({}) }))
vi.mock('./club.service', () => ({ ClubService: class ClubService {} }))
vi.mock('./search/search-intent', () => ({ interpretSearchQuery }))

import { SearchService } from './search.service'

beforeEach(() => {
  vi.clearAllMocks()
})

it('keeps keyword search and typo correction independent of AI', async () => {
  const service = new SearchService()
  const clubs = [{ uuid: 'club-1' }]
  const search = vi.fn().mockResolvedValueOnce([]).mockResolvedValueOnce(clubs)
  const searchSemantic = vi.fn()
  const filters = { hasMembershipFee: false }
  Object.defineProperties(service, {
    searchQueryService: { value: { search } },
    searchSemanticService: { value: { search: searchSemantic } },
    searchLogService: { value: { logSearch: vi.fn() } },
    typoCorrectionService: { value: { findCorrectedQuery: vi.fn().mockResolvedValue('music') } },
    hydratorService: { value: { toClubs: (entities: unknown[]) => entities } },
    sortService: { value: { sort: (results: unknown[]) => results } },
  })

  await expect(service.searchWithTypoCorrection('musc', { filters })).resolves.toEqual({
    clubs,
    correctedQuery: 'music',
    isTypoCorrected: true,
  })
  expect(search).toHaveBeenNthCalledWith(1, 'musc', filters)
  expect(search).toHaveBeenNthCalledWith(2, 'music', filters)
  expect(interpretSearchQuery).not.toHaveBeenCalled()
  expect(searchSemantic).not.toHaveBeenCalled()
})

it('applies interpreted filters to both searches while preserving explicit choices and the original query', async () => {
  const service = new SearchService()
  const query = '회비 없는 개발 동아리'
  const search = vi.fn().mockResolvedValue([])
  const searchSemantic = vi.fn().mockResolvedValue([])
  const logSearch = vi.fn()
  const findCorrectedQuery = vi.fn()
  interpretSearchQuery.mockResolvedValue({
    searchQuery: '소프트웨어 개발',
    filters: { hasMembershipFee: false, hasDongbang: true },
  })
  Object.defineProperties(service, {
    searchQueryService: { value: { search } },
    searchSemanticService: { value: { search: searchSemantic } },
    searchLogService: { value: { logSearch } },
    typoCorrectionService: { value: { findCorrectedQuery } },
    hydratorService: { value: { toClubs: vi.fn().mockResolvedValue([]) } },
    sortService: { value: { sort: (clubs: unknown[]) => clubs } },
  })

  await expect(
    service.searchWithAi(query, {
      filters: { hasMembershipFee: undefined, hasDongbang: false },
    }),
  ).resolves.toEqual({ clubs: [], correctedQuery: null, isTypoCorrected: false })

  const filters = { hasMembershipFee: false, hasDongbang: false }
  expect(search).toHaveBeenCalledWith('소프트웨어 개발', filters)
  expect(searchSemantic).toHaveBeenCalledWith('소프트웨어 개발', filters, undefined)
  expect(logSearch).toHaveBeenCalledWith(query)
  expect(findCorrectedQuery).not.toHaveBeenCalled()
})
