import type { Club } from '../../api'
import { CLUB_PREVIEW_CARD_HEIGHT, ClubPreviewCardSkeleton } from '../ClubPreviewCard'
import { HORIZONTAL_CAROUSEL_BOTTOM_PADDING, HorizontalCarousel } from '../HorizontalCarousel'

const SKELETON_CARD_COUNT = 3
const RECOMMENDATION_CAROUSEL_HEIGHT = CLUB_PREVIEW_CARD_HEIGHT + HORIZONTAL_CAROUSEL_BOTTOM_PADDING

// 앱 RandomRecommendationsHeader: "이런 동아리는 어때요?" 16/600 + "다양한 동아리를 추천해드려요" 12/400 (좌우 20, 간격 4)
function RandomRecommendationsHeader() {
  return (
    <div className="flex flex-col gap-1 px-5">
      <p className="text-[16px] font-semibold leading-[19px] text-[#757474]">
        이런 동아리는 어때요?
      </p>
      <p className="text-[12px] font-normal leading-[18px] text-[#757474]">
        다양한 동아리를 추천해드려요
      </p>
    </div>
  )
}

// 앱 RandomRecommendationsSkeleton: 같은 컨테이너에 미리보기 카드 스켈레톤 3개
export function RandomRecommendationsSkeleton() {
  return (
    <div className="flex w-full flex-col gap-4 bg-[#F3F0F5] pb-[30px] pt-6">
      <RandomRecommendationsHeader />
      <div className="flex flex-col" style={{ height: RECOMMENDATION_CAROUSEL_HEIGHT }}>
        <div className="flex h-full gap-2.5 overflow-hidden px-5 pb-0.5">
          {Array.from({ length: SKELETON_CARD_COUNT }, (_, i) => (
            <ClubPreviewCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}

type Props = {
  clubs: Club[]
}

// 앱 RandomRecommendations와 동일: 검색 결과 0건일 때 "이런 동아리는 어때요?" 캐러셀
// (bg #F3F0F5, 위 24 / 아래 30, 간격 16). 추천이 비어 있으면 아무것도 그리지 않는다.
export function RandomRecommendations({ clubs }: Props) {
  if (clubs.length === 0) {
    return null
  }

  return (
    <div className="flex w-full flex-col gap-4 bg-[#F3F0F5] pb-[30px] pt-6">
      <RandomRecommendationsHeader />
      <div className="flex flex-col" style={{ height: RECOMMENDATION_CAROUSEL_HEIGHT }}>
        <HorizontalCarousel clubs={clubs} />
      </div>
    </div>
  )
}
