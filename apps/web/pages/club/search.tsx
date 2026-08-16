import Head from 'next/head'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from 'react-query'
import {
  buildSearchParams,
  type ClubSearchFilters,
  DEFAULT_SEARCH_FILTERS,
  useRandomRecommendationsMutation,
  useSearchClubs,
} from '../../src/club/api/clubs'
import { useClearRecentSearches, useRecentSearches } from '../../src/club/api/recentSearches'
import { ClubList } from '../../src/club/features/club/list/ClubCard'
import { PopularClubs } from '../../src/club/features/search/PopularClubs'
import {
  RandomRecommendations,
  RandomRecommendationsSkeleton,
} from '../../src/club/features/search/RandomRecommendations'
import { RecentSearches } from '../../src/club/features/search/RecentSearches'
import { SearchBar } from '../../src/club/features/search/SearchBar'
import { SearchFilterBar } from '../../src/club/features/search/SearchFilterBar'
import {
  resetClubSearchOverlayFilters,
  SearchFilterOverlay,
} from '../../src/club/features/search/SearchFilterOverlay'
import { TypoCorrectionNotice } from '../../src/club/features/search/TypoCorrectionNotice'
import { AppTabBar } from '../../src/club/shared/components/AppTabBar'

const SEARCH_PATH = '/club/search'
const TAB_BAR_HEIGHT = 86

// 앱 Keyboard.dismiss(): 필터를 만지면 키보드를 내린다
const dismissKeyboard = () => {
  if (typeof document === 'undefined') return
  const active = document.activeElement
  if (active instanceof HTMLElement) active.blur()
}

/**
 * 앱 SearchScreen과 동일:
 * 헤더(타이틀 + 검색바; 타이틀을 누르면 초기 상태로) → 검색 전: 최근 검색어 + 인기 동아리
 * → 검색 후: (오타 교정 안내) + 필터바, 결과 목록 / 0건이면 안내 + 랜덤 추천, 상세 필터 오버레이
 * 앱처럼 헤더·필터바는 위에 고정되고 결과만 스크롤된다.
 */
const SearchPage = () => {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [inputValue, setInputValue] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [submittedSearchId, setSubmittedSearchId] = useState(0)
  const [isTypoNoticeVisible, setIsTypoNoticeVisible] = useState(true)
  const [filters, setFilters] = useState<ClubSearchFilters>(DEFAULT_SEARCH_FILTERS)
  const [isFilterOverlayVisible, setIsFilterOverlayVisible] = useState(false)

  // 앱 createSearchClubsRequest 와 같은 규칙으로 만든 요청 (변경되면 추천을 초기화/재요청)
  const requestKey = useMemo(
    () => buildSearchParams(submittedQuery, filters).toString(),
    [filters, submittedQuery],
  )
  const { data: searchResult, isFetching } = useSearchClubs(submittedQuery, filters)
  const { data: recentSearches } = useRecentSearches()
  const { mutate: clearRecentSearches } = useClearRecentSearches()
  const {
    data: randomRecommendations,
    isError: isRandomRecommendationsError,
    isLoading: isFetchingRandomRecommendations,
    mutate: fetchRandomRecommendations,
    reset: resetRandomRecommendations,
  } = useRandomRecommendationsMutation()

  const clubs = searchResult?.clubs

  const hasSubmittedQuery = submittedQuery.length > 0
  const shouldShowRandomRecommendations = hasSubmittedQuery && clubs?.length === 0 && !isFetching
  const isRandomRecommendationsLoading =
    shouldShowRandomRecommendations &&
    (isFetchingRandomRecommendations || (!randomRecommendations && !isRandomRecommendationsError))
  const correctedQuery = searchResult?.isTypoCorrected ? searchResult.correctedQuery : undefined
  const shouldShowTypoNotice = isTypoNoticeVisible && !!correctedQuery

  const resetSearchState = useCallback(() => {
    setInputValue('')
    setSubmittedQuery('')
    setSubmittedSearchId(0)
    resetRandomRecommendations()
    setIsTypoNoticeVisible(true)
    setFilters(DEFAULT_SEARCH_FILTERS)
    setIsFilterOverlayVisible(false)
  }, [resetRandomRecommendations])

  // 앱 navigation.reset + 상태 초기화 (헤더 타이틀 탭)
  const resetToInitialState = useCallback(() => {
    resetSearchState()
    window.scrollTo({ top: 0 })
  }, [resetSearchState])

  // 앱 tabPress 리스너: 탐색 탭을 다시 누르면(같은 URL로 replace) 초기 상태로
  useEffect(() => {
    const handleRouteChangeComplete = (url: string) => {
      const pathname = url.split('?')[0].split('#')[0]
      if (pathname === SEARCH_PATH) resetSearchState()
    }
    router.events.on('routeChangeComplete', handleRouteChangeComplete)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChangeComplete)
    }
  }, [router.events, resetSearchState])

  // 요청이 바뀌면 이전 추천을 비운다
  useEffect(() => {
    resetRandomRecommendations()
  }, [requestKey, resetRandomRecommendations])

  // 결과가 0건이 될 때마다(검색어/필터 변경, 재검색) 랜덤 추천을 새로 요청한다
  useEffect(() => {
    if (!shouldShowRandomRecommendations) return

    fetchRandomRecommendations()
  }, [fetchRandomRecommendations, requestKey, shouldShowRandomRecommendations, submittedSearchId])

  const handleSubmitQuery = (nextQuery: string) => {
    queryClient.cancelQueries(['searchClubs'])
    resetRandomRecommendations()
    setSubmittedQuery(nextQuery)
    setSubmittedSearchId((prev) => prev + 1)
    setIsTypoNoticeVisible(true)
    setIsFilterOverlayVisible(false)
  }

  const handleChangeFilters = useCallback((nextFilters: ClubSearchFilters) => {
    dismissKeyboard()
    setFilters(nextFilters)
  }, [])

  // 상세 필터 오버레이는 앱처럼 헤더+필터바 바로 아래부터 탭바 위까지 화면에 고정해서 띄운다
  const headerRef = useRef<HTMLDivElement>(null)
  const [overlayTop, setOverlayTop] = useState(0)
  const updateOverlayTop = useCallback(() => {
    setOverlayTop(headerRef.current?.getBoundingClientRect().bottom ?? 0)
  }, [])

  const handleToggleFilterOverlay = useCallback(() => {
    dismissKeyboard()
    updateOverlayTop()
    setIsFilterOverlayVisible((prev) => !prev)
  }, [updateOverlayTop])

  // 열려 있는 동안 헤더 높이(오타 안내 등)나 화면 크기가 바뀌면 위치를 다시 잡는다
  useEffect(() => {
    if (!isFilterOverlayVisible) return
    updateOverlayTop()
    window.addEventListener('resize', updateOverlayTop)
    return () => {
      window.removeEventListener('resize', updateOverlayTop)
    }
  })

  const handleSelectRecentSearch = (query: string) => {
    setInputValue(query)
    handleSubmitQuery(query)
  }

  return (
    <>
      <Head>
        <title>동아리 탐색 - 서울대 모든 동아리 올클리어</title>
      </Head>

      <div className="min-h-screen bg-[#FAFAFA] font-pretendard text-[#202020]">
        <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col pb-[86px]">
          {/* 헤더 + 검색바 (+ 검색 후에는 오타 안내/필터바) — 앱처럼 위에 고정 */}
          <div
            ref={headerRef}
            className="sticky z-20 bg-[#FAFAFA]"
            style={{ top: 'var(--app-banner-h, 0px)' }}
          >
            <div className="flex flex-col gap-[15px] px-5 py-2.5">
              <button
                type="button"
                onClick={resetToInitialState}
                className="w-fit pb-2.5 pl-[5px] pr-3 pt-2.5 text-left"
              >
                <h1 className="text-[25px] font-bold leading-[30px] text-[#202020]">
                  어떤 동아리를 찾아볼까요?
                </h1>
              </button>
              <SearchBar value={inputValue} onChange={setInputValue} onSubmit={handleSubmitQuery} />
            </div>

            {hasSubmittedQuery && (
              <div className="flex w-full flex-col gap-3.5 bg-[#FAFAFA] px-5 pb-2.5 pt-3.5">
                {shouldShowTypoNotice && correctedQuery ? (
                  <TypoCorrectionNotice
                    correctedQuery={correctedQuery}
                    onClose={() => setIsTypoNoticeVisible(false)}
                  />
                ) : null}
                <SearchFilterBar
                  filters={filters}
                  onChange={handleChangeFilters}
                  onPressFilter={handleToggleFilterOverlay}
                />
              </div>
            )}
          </div>

          {hasSubmittedQuery ? (
            /* 결과 영역: 목록 / (0건) 안내 + 랜덤 추천 */
            <div className="relative flex flex-1 flex-col">
              <ClubList
                clubs={clubs}
                emptyPlaceholder={'앗 검색 결과가 없어요!\n다른 키워드로 검색해주세요'}
                isLoading={isFetching}
              />
              {shouldShowRandomRecommendations ? (
                isRandomRecommendationsLoading ? (
                  <RandomRecommendationsSkeleton />
                ) : (
                  <RandomRecommendations clubs={randomRecommendations?.clubs ?? []} />
                )
              ) : null}
            </div>
          ) : (
            /* 초기 상태: 최근 검색어 + 인기 동아리 */
            <div className="flex flex-col gap-[30px] px-5 pt-3.5">
              <RecentSearches
                searches={recentSearches ?? []}
                onPressItem={handleSelectRecentSearch}
                onClearAll={() => clearRecentSearches()}
              />
              <PopularClubs />
            </div>
          )}
        </div>

        {isFilterOverlayVisible ? (
          <div className="fixed inset-x-0 z-20" style={{ top: overlayTop, bottom: TAB_BAR_HEIGHT }}>
            <div className="relative mx-auto h-full max-w-[480px]">
              <SearchFilterOverlay
                value={filters}
                onChange={handleChangeFilters}
                onReset={() => setFilters(resetClubSearchOverlayFilters(filters))}
                onClose={() => setIsFilterOverlayVisible(false)}
              />
            </div>
          </div>
        ) : null}

        <AppTabBar active="explore" />
      </div>
    </>
  )
}

export default SearchPage
