import { useRandomRecommendations } from '../../api'
import { ClubPreviewCard, ClubPreviewCardSkeleton } from '../ClubPreviewCard'
import { HorizontalCarousel } from '../HorizontalCarousel'

type Props = {
  enabled: boolean
}

// 앱 RandomRecommendations와 동일: 검색 결과 0건일 때 "이런 동아리는 어때요?" 캐러셀
export function RandomRecommendations({ enabled }: Props) {
  const { data: clubs, isLoading } = useRandomRecommendations(enabled)

  if (!enabled) return null
  if (!isLoading && (clubs ?? []).length === 0) return null

  return (
    <div className="flex w-full flex-col gap-4 bg-[#F3F0F5] pb-[30px] pt-6">
      <div className="flex flex-col gap-1 px-5">
        <p className="text-[16px] font-semibold text-[#757474]">이런 동아리는 어때요?</p>
        <p className="text-[12px] font-normal leading-[18px] text-[#757474]">
          다양한 동아리를 추천해드려요
        </p>
      </div>
      {isLoading ? (
        <div className="flex w-full gap-2.5 overflow-hidden px-5 pb-0.5">
          {Array.from({ length: 3 }, (_, i) => (
            <ClubPreviewCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <HorizontalCarousel>
          {(clubs ?? []).map((club) => (
            <ClubPreviewCard
              key={club.uuid}
              href={`/club/${club.uuid}`}
              title={club.name}
              description={club.description ?? ''}
              imageUri={club.imageUri}
            />
          ))}
        </HorizontalCarousel>
      )}
    </div>
  )
}
