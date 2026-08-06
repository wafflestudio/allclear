import Link from 'next/link'
import { useClubRankings } from '../../api'

// 앱 PopularClubs와 동일: "인기 동아리" 랭킹 5개 리스트
export function PopularClubs() {
  const { data: rankings, isLoading } = useClubRankings(5)

  const items = isLoading
    ? Array.from({ length: 5 }, (_, i) => ({
        ranking: i + 1,
        clubId: '',
        clubName: '---',
        category: '',
      }))
    : rankings ?? []

  return (
    <div className="flex w-full flex-col gap-5">
      <div>
        <div className="flex items-center py-[5px] pl-[5px] pr-3">
          <p className="flex-1 text-[20px] font-semibold leading-6 text-[#757474]">인기 동아리</p>
        </div>
        <p className="pl-1.5 text-[12px] font-normal leading-[18px] text-[#757474]">
          활동 후기가 많은 순이에요
        </p>
      </div>
      <div className="flex w-full flex-col gap-3 px-1.5">
        {items.map((item, index) => (
          <div key={`${item.ranking}-${item.clubId}`} className="flex flex-col gap-3">
            {index > 0 && <div className="h-px w-full bg-[#C1C1C1]/60" />}
            {item.clubId ? (
              <Link href={`/club/${item.clubId}`} className="flex items-center active:opacity-60">
                <span className="w-5 text-[14px] font-semibold leading-6 text-[#874FFF]">
                  {item.ranking}
                </span>
                <span className="truncate text-[14px] font-normal leading-[21px] text-[#757474]">
                  {item.clubName}
                </span>
              </Link>
            ) : (
              <div className="flex items-center">
                <span className="w-5 text-[14px] font-semibold leading-6 text-[#874FFF]">
                  {item.ranking}
                </span>
                <span className="text-[14px] font-normal leading-[21px] text-[#757474]">
                  {item.clubName}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
