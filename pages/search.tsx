import Head from 'next/head'
import { useEffect, useState } from 'react'
import { ClubSearchFilters, DEFAULT_SEARCH_FILTERS, useSearchClubs } from '../src/club/api'
import { AppTabBar } from '../src/club/components/AppTabBar'
import { ClubCard, ClubCardSkeleton } from '../src/club/components/ClubCard'
import { PopularClubs } from '../src/club/components/search/PopularClubs'
import { RandomRecommendations } from '../src/club/components/search/RandomRecommendations'
import { RecentSearches } from '../src/club/components/search/RecentSearches'
import { SearchBar } from '../src/club/components/search/SearchBar'
import { SearchFilterBar } from '../src/club/components/search/SearchFilterBar'
import { SearchFilterOverlay } from '../src/club/components/search/SearchFilterOverlay'
import { TypoCorrectionNotice } from '../src/club/components/search/TypoCorrectionNotice'
import { addRecentSearch } from '../src/club/recentSearches'

// 앱 SearchScreen과 동일: 헤더 → 검색바 → (초기: 최근검색/인기) | (결과: 필터바 + 목록)
const SearchPage = () => {
  const [inputValue, setInputValue] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [filters, setFilters] = useState<ClubSearchFilters>(DEFAULT_SEARCH_FILTERS)
  const [isOverlayOpen, setIsOverlayOpen] = useState(false)
  const [isTypoNoticeVisible, setIsTypoNoticeVisible] = useState(true)
  const [recentRefreshKey, setRecentRefreshKey] = useState(0)

  const hasSubmittedQuery = submittedQuery.trim().length > 0
  const { data: searchResult, isFetching } = useSearchClubs(submittedQuery, filters)

  // 검색 성공 시 최근 검색어 저장 (앱은 서버 저장 + invalidate, 웹은 localStorage)
  useEffect(() => {
    if (hasSubmittedQuery && searchResult) {
      addRecentSearch(submittedQuery)
      setRecentRefreshKey((k) => k + 1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchResult?.query])

  const handleSubmit = (query: string) => {
    const trimmed = query.trim()
    if (!trimmed) return
    setSubmittedQuery(trimmed)
    setIsTypoNoticeVisible(true)
    setIsOverlayOpen(false)
  }

  // 헤더 타이틀 탭 → 전체 초기화 (앱과 동일)
  const resetToInitialState = () => {
    setInputValue('')
    setSubmittedQuery('')
    setFilters(DEFAULT_SEARCH_FILTERS)
    setIsOverlayOpen(false)
    setIsTypoNoticeVisible(true)
  }

  const clubs = searchResult?.clubs ?? []
  const showEmptyResult = hasSubmittedQuery && !isFetching && clubs.length === 0

  return (
    <>
      <Head>
        <title>동아리 탐색 - 서울대 모든 동아리 올클리어</title>
      </Head>

      <div className="min-h-screen bg-[#FAFAFA] font-pretendard text-[#202020]">
        <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col pb-[86px]">
          {/* 헤더 + 검색바 */}
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
            <SearchBar
              value={inputValue}
              onChange={setInputValue}
              onSubmit={() => handleSubmit(inputValue)}
            />
          </div>

          {!hasSubmittedQuery ? (
            /* 초기 상태: 최근 검색어 + 인기 동아리 */
            <div className="flex flex-col gap-[30px] px-5 pt-3.5">
              <RecentSearches
                refreshKey={recentRefreshKey}
                onSelect={(query) => {
                  setInputValue(query)
                  handleSubmit(query)
                }}
              />
              <PopularClubs />
            </div>
          ) : (
            <>
              {/* 검색 컨트롤: 오타 교정 안내 + 필터바 */}
              <div className="flex w-full flex-col gap-3.5 bg-[#FAFAFA] px-5 pb-2.5 pt-3.5">
                {isTypoNoticeVisible &&
                  searchResult?.isTypoCorrected &&
                  searchResult.correctedQuery && (
                    <TypoCorrectionNotice
                      correctedQuery={searchResult.correctedQuery}
                      onClose={() => setIsTypoNoticeVisible(false)}
                    />
                  )}
                <SearchFilterBar
                  filters={filters}
                  onChange={setFilters}
                  onToggleOverlay={() => setIsOverlayOpen((open) => !open)}
                />
              </div>

              {/* 결과 영역 (+ 상세 필터 오버레이) */}
              <div className="relative flex flex-1 flex-col">
                {isOverlayOpen && (
                  <SearchFilterOverlay
                    filters={filters}
                    onChange={setFilters}
                    onClose={() => setIsOverlayOpen(false)}
                  />
                )}

                {isFetching && clubs.length === 0 ? (
                  <div className="flex flex-col gap-[25px] px-5 py-2">
                    {Array.from({ length: 6 }, (_, i) => (
                      <ClubCardSkeleton key={i} />
                    ))}
                  </div>
                ) : showEmptyResult ? (
                  <>
                    <div className="flex flex-1 flex-col items-center justify-center py-10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/images/not-found.png" alt="" width={122} height={99} />
                      <p className="mt-5 text-center text-[12px] font-normal leading-[18px] text-[#202020]">
                        앗 검색 결과가 없어요!
                        <br />
                        다른 키워드로 검색해주세요
                      </p>
                    </div>
                    <RandomRecommendations enabled={showEmptyResult} />
                  </>
                ) : (
                  <div className="flex flex-col gap-[25px] px-5 pb-5 pt-2">
                    {clubs.map((club) => (
                      <ClubCard key={club.uuid} club={club} />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <AppTabBar active="explore" />
      </div>
    </>
  )
}

export default SearchPage
