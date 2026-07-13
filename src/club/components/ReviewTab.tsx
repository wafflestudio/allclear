import type { Club } from '../../../server/domain/model/Club'
import { getCategoryTheme } from '../constants'
import { BackgroundCard } from './BackgroundCard'
import { MdiIcon } from './icons'
import { ReviewKeywordBar } from './ReviewKeywordBar'

type Props = {
  club: Club
  onWriteReview: () => void
}

export function ReviewTab({ club, onWriteReview }: Props) {
  const theme = getCategoryTheme(club.category)
  const sortedKeywords = [...club.reviewKeywords].sort((a, b) => b.totalUpvotes - a.totalUpvotes)

  return (
    <div className="mt-4 flex flex-col gap-3">
      <BackgroundCard className="relative">
        <p className="text-[16px] font-semibold text-[#757474]">이런 점이 좋았어요</p>
        {club.totalReviews > 0 && (
          <p className="mt-1 text-[12px] font-medium text-[#757474]">
            현재까지 {club.totalReviews}명이 참여했어요
          </p>
        )}
        {sortedKeywords.length > 0 ? (
          <div className="mt-3 flex flex-col gap-[5px]">
            {sortedKeywords.map((keyword) => (
              <ReviewKeywordBar
                key={keyword.id}
                iconUri={keyword.iconUri}
                title={keyword.title}
                totalUpvotes={keyword.totalUpvotes}
                totalReviews={club.totalReviews}
                theme={theme}
              />
            ))}
          </div>
        ) : (
          <div className="mt-3 flex min-h-[80px] flex-col items-center justify-center">
            <p className="text-center text-[12px] font-medium text-[#757474]">
              혹시 {club.name}에서 활동하셨나요?
            </p>
            <p className="text-center text-[12px] font-medium text-[#757474]">
              다음에 들어올 부원들을 위해 경험을 공유해주세요!
            </p>
          </div>
        )}
      </BackgroundCard>

      <button
        type="button"
        onClick={onWriteReview}
        className="mt-1 flex w-full items-center justify-between rounded-2xl bg-white p-4 text-left shadow-[0_2px_8px_rgba(0,0,0,0.06)] active:bg-[#F3F0F5]"
      >
        <span className="flex flex-col">
          <span className="text-[14px] font-semibold text-[#874FFF]">동아리 활동 후기 남기기</span>
          <span className="mt-1 text-[12px] font-normal leading-[18px] text-[#BCBCBC]">
            현재까지 {club.totalReviews}명이 참여했어요
          </span>
        </span>
        <span className="text-[#874FFF]">
          <MdiIcon name="chevronRight" size={24} />
        </span>
      </button>
    </div>
  )
}
