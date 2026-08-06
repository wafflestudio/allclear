import Link from 'next/link'
import type { Club } from '../api'
import { getCategoryTheme } from '../constants'
import { useSaveClub } from '../useSaveClub'
import { ReviewKeywordPill } from './ReviewKeywordPill'

type Props = {
  club: Club
  // 카테고리 목록 화면에서만 카테고리 테마색 사용 (앱과 동일).
  // 검색 결과에서는 포인트컬러 fallback.
  useCategoryTheme?: boolean
}

const FALLBACK_THEME = { themeColor: '#874FFF', backgroundColor: 'rgba(135,79,255,0.1)' }
const NO_REVIEW_THEME = { themeColor: '#CBCBCB', backgroundColor: 'rgba(193,193,193,0.1)' }

// 앱 ClubCard와 동일: 높이 90, 로고 박스 90×90(테두리 0.5 테마색), 이미지 70×70
export function ClubCard({ club, useCategoryTheme = false }: Props) {
  const theme = useCategoryTheme ? getCategoryTheme(club.category) : FALLBACK_THEME
  const { isSaved, toggle } = useSaveClub(club)

  return (
    <div className="flex h-[90px] w-full">
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
            className="rounded-lg object-contain"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1">
            <p className="mb-1 truncate text-[16px] font-semibold text-[#202020]">{club.name}</p>
            <p className="line-clamp-2 text-[14px] font-normal text-[#757474]">
              {club.description}
            </p>
          </div>
          <div className="flex h-[21px] gap-1">
            {club.reviewKeywords.length > 0 ? (
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
        className="ml-1 self-start active:opacity-50"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={isSaved ? '/icons/heart-fill.png' : '/icons/heart.png'}
          alt=""
          width={20}
          height={20}
          className="object-contain"
        />
      </button>
    </div>
  )
}

export function ClubCardSkeleton() {
  return (
    <div className="flex h-[90px] w-full animate-pulse">
      <div className="mr-[15px] h-[90px] w-[90px] rounded-lg bg-[#F3F0F5]" />
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
