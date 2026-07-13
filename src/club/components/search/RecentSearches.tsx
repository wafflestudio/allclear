import { useEffect, useState } from 'react'
import { clearRecentSearches, getRecentSearches } from '../../recentSearches'

type Props = {
  onSelect: (query: string) => void
  // 검색 제출로 목록이 바뀐 뒤 다시 읽어오기 위한 신호
  refreshKey: number
}

// 앱 RecentSearches와 동일한 UI (저장소만 서버 → localStorage)
export function RecentSearches({ onSelect, refreshKey }: Props) {
  const [searches, setSearches] = useState<string[]>([])

  useEffect(() => {
    setSearches(getRecentSearches())
  }, [refreshKey])

  return (
    <div className="flex w-full min-w-0 flex-col gap-[9px]">
      <div className="flex w-full items-center gap-2.5 px-[5px] py-[5px]">
        <p className="flex-1 text-[20px] font-semibold leading-6 text-[#757474]">최근 검색어</p>
        {searches.length > 0 && (
          <button
            type="button"
            onClick={() => setSearches(clearRecentSearches())}
            className="pb-px pt-[5px] text-[12px] font-normal leading-[18px] text-[#757474] active:opacity-60"
          >
            검색내역 지우기
          </button>
        )}
      </div>
      {searches.length === 0 ? (
        <p className="pl-1.5 text-[12px] font-normal leading-[18px] text-[#757474]">
          최근 검색한 내역이 없어요. 새로운 동아리를 탐색해보세요!
        </p>
      ) : (
        <div className="flex flex-wrap">
          {searches.map((query) => (
            <button
              key={query}
              type="button"
              onClick={() => onSelect(query)}
              className="mb-2 ml-2 flex h-6 items-center rounded-[20px] border-[0.3px] border-[#874FFF] bg-[rgba(135,79,255,0.1)] px-2.5 py-1.5 active:opacity-60"
            >
              <span className="text-[12px] font-normal leading-3 text-[#757474]">{query}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
