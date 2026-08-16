type Props = {
  searches: string[]
  onPressItem: (query: string) => void
  onClearAll: () => void
}

/**
 * 앱 RecentSearches와 동일: 최소 높이 100, 세로 간격 9
 * - 헤더 행(좌우 5, 위아래 5, 간격 10): "최근 검색어" 20/600 #757474 + (있을 때만) "검색내역 지우기" 12/400
 * - 비어 있으면 안내 문구 12/400 (왼쪽 6)
 * - 칩: 최소 높이 24, 왼쪽 8 / 아래 8 마진, 좌우 10 / 위아래 5 패딩, radius 20,
 *   테두리 0.3 #874FFF, 배경 rgba(135,79,255,0.1), 글씨 12/400 lh14 #757474 (#150: 텍스트 잘림 수정)
 */
export function RecentSearches({ searches, onPressItem, onClearAll }: Props) {
  const isEmpty = searches.length === 0

  return (
    <div className="flex w-full min-w-0 flex-col gap-[9px]" style={{ minHeight: 100 }}>
      <div className="flex w-full items-center gap-2.5 px-[5px] py-[5px]">
        <p className="flex-1 text-[20px] font-semibold leading-6 text-[#757474]">최근 검색어</p>
        {!isEmpty && (
          <button
            type="button"
            onClick={onClearAll}
            className="-mx-2 -my-2 px-2 pb-[9px] pt-[13px] text-[12px] font-normal leading-[18px] text-[#757474]"
          >
            검색내역 지우기
          </button>
        )}
      </div>

      {isEmpty ? (
        <p className="pl-1.5 text-left text-[12px] font-normal leading-[18px] text-[#757474]">
          최근 검색한 내역이 없어요. 새로운 동아리를 탐색해보세요!
        </p>
      ) : (
        <div className="flex flex-wrap">
          {searches.map((query) => (
            <button
              key={query}
              type="button"
              onClick={() => onPressItem(query)}
              className="mb-2 ml-2 flex min-h-6 items-center justify-center rounded-[20px] border-[0.3px] border-[#874FFF] bg-[rgba(135,79,255,0.1)] px-2.5 py-[5px]"
            >
              <span className="text-[12px] font-normal leading-[14px] text-[#757474]">{query}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
