import { beforeEach, expect, it, vi } from 'vitest'

const { extractSearchTopic } = vi.hoisted(() => ({
  extractSearchTopic: vi.fn(),
}))

vi.mock('server/provider', () => ({ Service: () => undefined, Inject: () => () => undefined }))
vi.mock('server/infra/database/prisma', () => ({ getPrismaClient: () => ({}) }))
vi.mock('./club.service', () => ({ ClubService: class ClubService {} }))
vi.mock('./search/search-topic', () => ({ extractSearchTopic }))

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
  expect(extractSearchTopic).not.toHaveBeenCalled()
  expect(searchSemantic).not.toHaveBeenCalled()
})

it('searches the topic with the URL filters while preserving the original query', async () => {
  const service = new SearchService()
  const query = '사진 찍는 동아리'
  const search = vi.fn().mockResolvedValue([])
  const searchSemantic = vi.fn().mockResolvedValue([])
  const findKeywords = vi.fn().mockResolvedValue([])
  const logSearch = vi.fn()
  const findCorrectedQuery = vi.fn().mockResolvedValue(null)
  const filters = { hasDongbang: false }
  extractSearchTopic.mockResolvedValue('사진 찍는')
  Object.defineProperties(service, {
    searchQueryService: { value: { search } },
    searchSemanticService: { value: { search: searchSemantic, findKeywords } },
    searchLogService: { value: { logSearch } },
    typoCorrectionService: { value: { findCorrectedQuery } },
    hydratorService: { value: { toClubs: vi.fn().mockResolvedValue([]) } },
    sortService: { value: { sort: (clubs: unknown[]) => clubs } },
  })

  await expect(service.searchWithAi(query, { filters })).resolves.toEqual({
    clubs: [],
    correctedQuery: null,
    isTypoCorrected: false,
  })

  expect(extractSearchTopic).toHaveBeenCalledWith(query)
  expect(findKeywords).toHaveBeenCalledWith('사진 찍는')
  expect(search).toHaveBeenCalledWith('사진 찍는', filters)
  expect(searchSemantic).toHaveBeenCalledWith('사진 찍는', filters, undefined)
  expect(logSearch).toHaveBeenCalledWith(query)
})

it('lists topic matches, then keyword matches, then semantic matches, each club once', async () => {
  const service = new SearchService()
  const clubsFor: Record<string, Array<{ uuid: string }>> = {
    '사진 찍는': [{ uuid: 'topic' }],
    사진: [{ uuid: 'topic' }, { uuid: 'keyword-1' }],
    찍는: [{ uuid: 'keyword-2' }],
  }
  const search = vi.fn(async (text: string) => clubsFor[text])
  const semanticClubs = [{ uuid: 'keyword-1' }, { uuid: 'semantic' }]
  extractSearchTopic.mockResolvedValue('사진 찍는')
  Object.defineProperties(service, {
    searchQueryService: { value: { search } },
    searchSemanticService: {
      value: {
        search: vi.fn().mockResolvedValue(semanticClubs),
        findKeywords: vi.fn().mockResolvedValue(['사진', '찍는']),
      },
    },
    searchLogService: { value: { logSearch: vi.fn() } },
    typoCorrectionService: { value: { findCorrectedQuery: vi.fn() } },
    hydratorService: { value: { toClubs: (entities: unknown[]) => entities } },
    sortService: { value: { sort: (results: unknown[]) => results } },
  })

  const { clubs } = await service.searchWithAi('사진 찍는 동아리')

  expect(clubs.map((club) => club.uuid)).toEqual(['topic', 'keyword-1', 'keyword-2', 'semantic'])
})

it('does not search a keyword that equals the whole topic twice', async () => {
  const service = new SearchService()
  const search = vi.fn().mockResolvedValue([{ uuid: 'club-1' }])
  extractSearchTopic.mockResolvedValue('밴드')
  Object.defineProperties(service, {
    searchQueryService: { value: { search } },
    searchSemanticService: {
      value: {
        search: vi.fn().mockResolvedValue([]),
        findKeywords: vi.fn().mockResolvedValue(['밴드']),
      },
    },
    searchLogService: { value: { logSearch: vi.fn() } },
    typoCorrectionService: { value: { findCorrectedQuery: vi.fn() } },
    hydratorService: { value: { toClubs: (entities: unknown[]) => entities } },
    sortService: { value: { sort: (results: unknown[]) => results } },
  })

  await service.searchWithAi('밴드 동아리')

  expect(search).toHaveBeenCalledTimes(1)
})

it('corrects typos in the topic when no word of it is found in clubs', async () => {
  const service = new SearchService()
  const clubs = [{ uuid: 'club-1' }]
  const search = vi.fn().mockResolvedValueOnce([]).mockResolvedValueOnce(clubs)
  extractSearchTopic.mockResolvedValue('벤드')
  Object.defineProperties(service, {
    searchQueryService: { value: { search } },
    searchSemanticService: {
      value: {
        search: vi.fn().mockResolvedValue([]),
        findKeywords: vi.fn().mockResolvedValue([]),
      },
    },
    searchLogService: { value: { logSearch: vi.fn() } },
    typoCorrectionService: { value: { findCorrectedQuery: vi.fn().mockResolvedValue('밴드') } },
    hydratorService: { value: { toClubs: (entities: unknown[]) => entities } },
    sortService: { value: { sort: (results: unknown[]) => results } },
  })

  await expect(service.searchWithAi('벤드 동아리')).resolves.toEqual({
    clubs,
    correctedQuery: '밴드',
    isTypoCorrected: true,
  })
  expect(search).toHaveBeenNthCalledWith(2, '밴드', {})
})

it('does not correct typos when a word of the topic is found in clubs', async () => {
  const service = new SearchService()
  const clubsFor: Record<string, Array<{ uuid: string }>> = {
    '경영 학회': [],
    경영: [{ uuid: 'club-1' }],
  }
  const findCorrectedQuery = vi.fn().mockResolvedValue('경영극회')
  extractSearchTopic.mockResolvedValue('경영 학회')
  Object.defineProperties(service, {
    searchQueryService: { value: { search: vi.fn(async (text: string) => clubsFor[text]) } },
    searchSemanticService: {
      value: {
        search: vi.fn().mockResolvedValue([]),
        findKeywords: vi.fn().mockResolvedValue(['경영']),
      },
    },
    searchLogService: { value: { logSearch: vi.fn() } },
    typoCorrectionService: { value: { findCorrectedQuery } },
    hydratorService: { value: { toClubs: (entities: unknown[]) => entities } },
    sortService: { value: { sort: (results: unknown[]) => results } },
  })

  await expect(service.searchWithAi('경영 학회')).resolves.toEqual({
    clubs: [{ uuid: 'club-1' }],
    correctedQuery: null,
    isTypoCorrected: false,
  })
  expect(findCorrectedQuery).not.toHaveBeenCalled()
})
