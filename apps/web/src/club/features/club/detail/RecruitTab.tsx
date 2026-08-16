import dayjs from 'dayjs'
import 'dayjs/locale/ko'
import type { Club } from '../../../../../server/domain/model/Club'
import { useRecruitmentDetail, useRepresentativeRecruitment } from '../../../api/recruitments'
import { MdiIcon } from '../../../shared/components/icons'
import { BackgroundCard } from './BackgroundCard'
import type { ClubTabLabel } from './ClubDetailTabBar'
import { LoginBlurOverlay } from './LoginBlurOverlay'
import { RecruitmentDetailCard } from './RecruitmentDetailCard'

// 앱과 동일한 포맷: "7월 13일 월요일 오후 3시에 업데이트 되었어요" (연도가 다르면 "YY년 " 접두)
function formatUpdatedAt(iso: string): string {
  const date = dayjs(iso).locale('ko')
  const yearPrefix = date.year() !== dayjs().year() ? date.format('YY년 ') : ''
  return `${yearPrefix}${date.format('M월 D일 dddd A h시')}에 업데이트 되었어요`
}

const ARTICLE_CARD_STYLE = {
  padding: 20,
  borderRadius: 15,
  boxShadow: '0 1px 5px rgba(0,0,0,0.05)',
} as const

type Props = {
  club: Club
  tabLabel: ClubTabLabel
  isLoggedIn: boolean
  onLoginPress: () => void
  onPreviousPress: (representativeRecruitmentId: number | null) => void
}

/**
 * 앱 ClubDetail/RecruitTab.tsx 와 동일:
 * 대표 모집공고(id, updatedAt) → 공고 상세(content) 두 단계 조회.
 * 로딩/에러(다시 시도)/빈 상태, 비로그인 시 LoginBlurOverlay, 업데이트 시각 푸터, "이전 공고 확인하기" 버튼.
 */
export function RecruitTab({ club, tabLabel, isLoggedIn, onLoginPress, onPreviousPress }: Props) {
  const representativeQuery = useRepresentativeRecruitment(club.uuid)
  const representativeId = representativeQuery.data?.id ?? null
  const detailQuery = useRecruitmentDetail(representativeId)
  const isLoading =
    representativeQuery.isLoading || (representativeId !== null && detailQuery.isLoading)
  const isError = representativeQuery.isError || detailQuery.isError
  const content = detailQuery.data?.content
  const representativeUpdatedAt = representativeQuery.data?.updatedAt

  return (
    <div className="mt-[30px] flex flex-col gap-5">
      <div className="flex flex-col gap-2.5">
        {/* 앱 articleCard: minHeight 200, padding 20, radius 15, 그림자 (0,1) 5% blur 5 */}
        <BackgroundCard className="min-h-[200px]" style={ARTICLE_CARD_STYLE}>
          {isLoading ? (
            <div className="flex min-h-[160px] flex-col items-center justify-center gap-2.5">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#874FFF] border-t-transparent" />
            </div>
          ) : isError ? (
            <div className="flex min-h-[160px] flex-col items-center justify-center gap-2.5">
              <p className="text-center text-[12px] font-normal leading-[18px] text-[#757474]">
                모집공고를 불러오지 못했어요.
              </p>
              <button
                type="button"
                onClick={() => {
                  representativeQuery.refetch()
                  if (representativeId !== null) detailQuery.refetch()
                }}
                className="rounded-2xl bg-[rgba(135,79,255,0.1)] px-3.5 py-2 text-[12px] font-medium text-[#874FFF] active:opacity-60"
              >
                다시 시도
              </button>
            </div>
          ) : content ? (
            <>
              {!isLoggedIn && (
                <LoginBlurOverlay
                  clubName={club.name}
                  tabLabel={tabLabel}
                  onLoginPress={onLoginPress}
                />
              )}
              <RecruitmentDetailCard content={content} />
            </>
          ) : (
            <div className="flex min-h-[160px] flex-col items-center justify-center gap-2.5">
              <p className="text-center text-[12px] font-normal leading-[18px] text-[#757474]">
                아직 등록된 모집공고가 없어요.
              </p>
            </div>
          )}
        </BackgroundCard>

        {content && representativeUpdatedAt && (
          <div className="px-[5px]">
            <p className="text-[12px] font-normal leading-5 text-[#757474]">
              {formatUpdatedAt(representativeUpdatedAt)}
            </p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => onPreviousPress(representativeId)}
        className="flex h-[66px] items-center justify-between rounded-xl bg-white px-4 py-1.5 text-left shadow-[0_1px_5px_rgba(0,0,0,0.05)] active:opacity-60"
      >
        <span className="text-[13px] font-bold leading-[22px] text-[#C1C1C1]">
          이전 공고 확인하기
        </span>
        <span className="text-[#C1C1C1]">
          <MdiIcon name="chevronRight" size={16} />
        </span>
      </button>
    </div>
  )
}
