import Link from 'next/link'
import type { Club } from '../../../api/clubs'
import { ReviewKeywordPill } from '../../../shared/components/ReviewKeywordPill'
import { getCategoryTheme } from '../../../shared/constants'
import { useSaveClub } from '../../../shared/hooks/useSaveClub'
import { getClubSummaryWithAffiliation } from '../../../shared/utils/club'

type Props = {
  club: Club
  // 카테고리 목록 화면에서만 카테고리 테마색 사용 (앱 ClubListScreen이 category를 넘기는 것과 동일).
  // 검색/저장 목록에서는 포인트컬러(#874FFF / POINTCOLOR_10) fallback.
  useCategoryTheme?: boolean
}

const FALLBACK_THEME = { themeColor: '#874FFF', backgroundColor: 'rgba(135,79,255,0.1)' }
const NO_REVIEW_THEME = { themeColor: '#CBCBCB', backgroundColor: 'rgba(193,193,193,0.1)' }

// 앱 ClubCard와 동일: 높이 90, 로고 박스 90×90(테두리 0.5 테마색, radius 8), 이미지 70×70(contain),
// 제목 16/600 한 줄 말줄임(하트 영역 50px 확보), 설명 14/400 두 줄, 후기 키워드 알약 최대 2개,
// 하트 버튼은 카드 우상단에 절대 배치(hitSlop 8)
export function ClubCard({ club, useCategoryTheme = false }: Props) {
  const theme = useCategoryTheme ? getCategoryTheme(club.category) : FALLBACK_THEME
  const { isSaved, toggle } = useSaveClub(club)

  return (
    <div className="relative flex h-[90px] w-full">
      <Link href={`/club/${club.uuid}`} className="flex min-w-0 flex-1 active:opacity-50">
        <div
          className="mr-[15px] flex h-[90px] w-[90px] shrink-0 items-center justify-center rounded-lg border-[0.5px] bg-white"
          style={{ borderColor: theme.themeColor }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={club.imageUri}
            alt={`${club.name} 로고`}
            width={70}
            height={70}
            className="h-[70px] w-[70px] rounded-lg object-contain"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1">
            <p className="mb-1 truncate pr-[50px] text-[16px] font-semibold leading-[19px] text-[#202020]">
              {club.name}
            </p>
            <p className="line-clamp-2 text-[14px] font-normal leading-[17px] text-[#757474]">
              {getClubSummaryWithAffiliation(club)}
            </p>
          </div>
          <div className="flex min-h-[21px] gap-1">
            {club.reviewKeywords && club.reviewKeywords.length > 0 ? (
              club.reviewKeywords
                .slice(0, 2)
                .map((keyword) => (
                  <ReviewKeywordPill
                    key={keyword.id}
                    iconUri={keyword.iconUri}
                    title={keyword.title}
                    theme={theme}
                  />
                ))
            ) : (
              <ReviewKeywordPill
                iconUri="🥲"
                title="아직 활동 후기가 없어요"
                theme={NO_REVIEW_THEME}
              />
            )}
          </div>
        </div>
      </Link>
      <button
        type="button"
        onClick={toggle}
        aria-label={isSaved ? '동아리 저장 해제' : '동아리 저장'}
        className="absolute -right-2 -top-2 p-2 active:opacity-50"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={isSaved ? '/icons/heart-fill.png' : '/icons/heart.png'}
          alt=""
          width={20}
          height={20}
          className="h-5 w-5 object-contain"
        />
      </button>
    </div>
  )
}

// 앱 ClubCardSkeleton: 배경 #F3F0F5 / 하이라이트 흰색
export function ClubCardSkeleton() {
  return (
    <div className="flex h-[90px] w-full animate-pulse">
      <div className="mr-[15px] h-[90px] w-[90px] shrink-0 rounded-lg bg-[#F3F0F5]" />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex-1">
          <div className="h-[18px] w-40 rounded bg-[#F3F0F5]" />
          <div className="mt-2 h-8 w-full rounded bg-[#F3F0F5]" />
        </div>
        <div className="h-5 w-[120px] rounded bg-[#F3F0F5]" />
      </div>
    </div>
  )
}

type ClubListSkeletonProps = {
  count?: number
}

// 앱 ClubListSkeleton: 세로 여백 8, 카드 간격 25, 좌우 20
export function ClubListSkeleton({ count = 6 }: ClubListSkeletonProps) {
  return (
    <div className="flex flex-col gap-[25px] py-2">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="px-5">
          <ClubCardSkeleton />
        </div>
      ))}
    </div>
  )
}

type ClubListProps = {
  clubs: Club[] | undefined
  useCategoryTheme?: boolean
  emptyPlaceholder: string
  isLoading?: boolean
}

/**
 * 앱 ClubList와 동일:
 * - 로딩 중이면 스켈레톤, 데이터가 없으면(undefined) 아무것도 그리지 않음
 * - 0건이면 not-found 이미지(122×99) + 안내 문구(12/400, 위 여백 20)를 남은 영역 가운데에
 * - 목록은 위 8 / 아래 20 여백, 카드 간격 25, 좌우 20
 */
export function ClubList({ clubs, useCategoryTheme, emptyPlaceholder, isLoading }: ClubListProps) {
  if (isLoading) return <ClubListSkeleton />
  if (!clubs) return null
  if (clubs.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/not-found.png" alt="" width={122} height={99} />
        <p className="mt-5 whitespace-pre-line text-center text-[12px] font-normal leading-[18px] text-[#202020]">
          {emptyPlaceholder.replace(/\\n/g, '\n')}
        </p>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-[25px] pb-5 pt-2">
      {clubs.map((club) => (
        <div key={club.id} className="w-full px-5">
          <ClubCard club={club} useCategoryTheme={useCategoryTheme} />
        </div>
      ))}
    </div>
  )
}
