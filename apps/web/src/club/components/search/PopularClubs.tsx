import Link from 'next/link'
import { Fragment } from 'react'
import { useClubRankings } from '../../api'

const TOP_K = 5

// 앱 PLACEHOLDER_ITEMS: 로딩 중에는 1~5위에 "---" 를 그린다 (누를 수 없음)
const PLACEHOLDER_ITEMS = Array.from({ length: TOP_K }, (_, i) => ({
  ranking: i + 1,
  clubId: `placeholder-${i + 1}`,
  clubName: '---',
  category: '',
}))

/**
 * 앱 PopularClubs와 동일: 세로 간격 20
 * - 헤더 행(왼쪽 5 / 오른쪽 12 / 위아래 5): "인기 동아리" 20/600 #757474, 아래 "활동 후기가 많은 순이에요" 12/400 (왼쪽 6)
 * - 목록(간격 12, 좌우 6): 순위 14/600 #874FFF(폭 20, lh24) + 이름 14/400 #757474(lh21), 항목 사이 hairline #C1C1C1
 */
export function PopularClubs() {
  const { data: clubRankings, isLoading } = useClubRankings(TOP_K)

  const isInteractive = !isLoading && !!clubRankings
  const items = isInteractive ? clubRankings : PLACEHOLDER_ITEMS

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="w-full">
        <div className="flex w-full items-center py-[5px] pl-[5px] pr-3">
          <p className="flex-1 text-[20px] font-semibold leading-6 text-[#757474]">인기 동아리</p>
        </div>
        <p className="pl-1.5 text-[12px] font-normal leading-[18px] text-[#757474]">
          활동 후기가 많은 순이에요
        </p>
      </div>
      <div className="flex w-full flex-col gap-3 px-1.5">
        {items.map((item, index) => (
          <Fragment key={item.clubId}>
            {isInteractive ? (
              <Link href={`/club/${item.clubId}`} className="flex items-center">
                <span className="w-5 shrink-0 text-[14px] font-semibold leading-6 text-[#874FFF]">
                  {item.ranking}
                </span>
                <span className="min-w-0 text-[14px] font-normal leading-[21px] text-[#757474]">
                  {item.clubName}
                </span>
              </Link>
            ) : (
              <div className="flex items-center">
                <span className="w-5 shrink-0 text-[14px] font-semibold leading-6 text-[#874FFF]">
                  {item.ranking}
                </span>
                <span className="text-[14px] font-normal leading-[21px] text-[#757474]">
                  {item.clubName}
                </span>
              </div>
            )}
            {index < items.length - 1 && (
              <div className="w-full border-t-[0.5px] border-[#C1C1C1]" />
            )}
          </Fragment>
        ))}
      </div>
    </div>
  )
}
