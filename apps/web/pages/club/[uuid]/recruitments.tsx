import Head from 'next/head'
import { useRouter } from 'next/router'
import { useState } from 'react'
import {
  type RecruitmentSummary,
  useClubRecruitments,
  useRecruitmentDetail,
  useRepresentativeRecruitment,
} from '../../../src/club/api.detail'
import { useProfile, useRequireLogin } from '../../../src/club/auth/AuthContext'
import { BackgroundCard } from '../../../src/club/components/BackgroundCard'
import { BackHeader } from '../../../src/club/components/BackHeader'
import { RecruitmentDetailCard } from '../../../src/club/components/detail/RecruitmentDetailCard'
import { getNextExpandedRecruitmentId } from '../../../src/club/components/detail/recruitmentPresentation'
import { MdiIcon } from '../../../src/club/components/icons'

// 앱 itemCard: paddingVertical 14 (좌우는 BackgroundCard 기본 16)
const ITEM_CARD_STYLE = { paddingTop: 14, paddingBottom: 14 } as const

const RETRY_BUTTON_CLASS =
  'rounded-[18px] bg-[rgba(135,79,255,0.1)] px-3.5 py-2 text-[12px] font-medium text-[#874FFF] active:opacity-60'

function Spinner() {
  return (
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#874FFF] border-t-transparent" />
  )
}

// 앱 PreviousRecruitmentItem: 헤더(연월 제목/공고명/화살표)를 누르면 펼쳐지며 그때 상세를 조회한다
function PreviousRecruitmentItem({
  recruitment,
  isExpanded,
  onPress,
}: {
  recruitment: RecruitmentSummary
  isExpanded: boolean
  onPress: () => void
}) {
  const detailQuery = useRecruitmentDetail(recruitment.id, isExpanded)

  return (
    <BackgroundCard style={ITEM_CARD_STYLE}>
      <button
        type="button"
        aria-expanded={isExpanded}
        onClick={onPress}
        className="flex min-h-[44px] w-full items-center justify-between text-left"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-1 pr-3">
          <span
            className={`text-[16px] font-semibold ${isExpanded ? 'text-[#874FFF]' : 'text-[#757474]'}`}
          >
            {recruitment.display_title}
          </span>
          <span className="truncate text-[12px] font-normal leading-[18px] text-[#BCBCBC]">
            {recruitment.title}
          </span>
        </span>
        <span className={isExpanded ? 'text-[#874FFF]' : 'text-[#757474]'}>
          <MdiIcon name={isExpanded ? 'chevronUp' : 'chevronDown'} size={24} />
        </span>
      </button>

      {isExpanded && (
        <div className="mt-3 border-t border-[#EAEAEA] pt-[18px]">
          {detailQuery.isLoading ? (
            <div className="flex justify-center">
              <Spinner />
            </div>
          ) : detailQuery.isError ? (
            <button
              type="button"
              onClick={() => detailQuery.refetch()}
              className={RETRY_BUTTON_CLASS}
            >
              공고를 불러오지 못했어요. 다시 시도
            </button>
          ) : detailQuery.data ? (
            <RecruitmentDetailCard content={detailQuery.data.content} />
          ) : null}
        </div>
      )}
    </BackgroundCard>
  )
}

/**
 * 앱 PreviousRecruitmentsScreen 의 웹 미러 (/club/{uuid}/recruitments?representative={id}).
 * 로그인 필요. 동아리의 공고 목록에서 대표 공고를 뺀 "이전 공고"를 아코디언으로 보여준다.
 * representative 쿼리가 없으면(직접 진입) 대표 공고를 조회해서 제외한다.
 */
const PreviousRecruitmentsPage = () => {
  const router = useRouter()
  const clubId = typeof router.query.uuid === 'string' ? router.query.uuid : undefined
  const representativeParam =
    typeof router.query.representative === 'string' ? Number(router.query.representative) : NaN
  const hasRepresentativeParam = !Number.isNaN(representativeParam)

  const { user, isLoading: isProfileLoading } = useProfile()
  const requireLogin = useRequireLogin()
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const listQuery = useClubRecruitments(clubId, !!user)
  const representativeQuery = useRepresentativeRecruitment(
    clubId,
    !!user && !hasRepresentativeParam,
  )
  const representativeRecruitmentId = hasRepresentativeParam
    ? representativeParam
    : (representativeQuery.data?.id ?? null)
  const clubName = listQuery.data?.club_name ?? ''
  const previousRecruitments =
    listQuery.data?.recruitments.filter((item) => item.id !== representativeRecruitmentId) ?? []
  // 정적 최적화된 페이지라 첫 렌더에는 router.query 가 비어 있다 → 준비될 때까지 로딩으로 취급
  const isLoading =
    !router.isReady ||
    listQuery.isLoading ||
    (!hasRepresentativeParam && representativeQuery.isLoading)

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else if (clubId) {
      router.push(`/club/${clubId}`)
    } else {
      router.push('/club')
    }
  }

  return (
    <>
      <Head>
        <title>이전 공고 목록 - 서울대 모든 동아리 올클리어</title>
      </Head>

      <div className="min-h-screen bg-[#FAFAFA] font-pretendard text-[#202020]">
        <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col">
          <BackHeader title="이전 공고 목록" onBack={handleBack} />

          {isProfileLoading ? (
            // 토큰으로 프로필을 복원하는 동안은 로그인 안내 대신 로딩 (플리커 방지)
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6">
              <Spinner />
            </div>
          ) : !user ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6">
              <p className="text-center text-[14px] font-normal text-[#757474]">
                로그인 후 이전 공고를 확인할 수 있어요.
              </p>
              <button
                type="button"
                onClick={() => requireLogin(() => {})}
                className="min-w-[120px] rounded-[22px] bg-[#874FFF] px-5 py-3 text-center text-[14px] font-semibold text-white active:bg-[#4F2E94]"
              >
                로그인하기
              </button>
            </div>
          ) : isLoading ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6">
              <Spinner />
            </div>
          ) : listQuery.isError ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6">
              <p className="text-center text-[14px] font-normal text-[#757474]">
                이전 공고를 불러오지 못했어요.
              </p>
              <button
                type="button"
                onClick={() => listQuery.refetch()}
                className={RETRY_BUTTON_CLASS}
              >
                다시 시도
              </button>
            </div>
          ) : previousRecruitments.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6">
              <p className="text-center text-[14px] font-normal text-[#757474]">
                아직 이전 공고가 없어요.
              </p>
            </div>
          ) : (
            <div className="px-4 pb-10 pt-3">
              <p className="mb-3 text-[14px] font-normal text-[#757474]">{clubName}</p>
              <div className="flex flex-col gap-3">
                {previousRecruitments.map((recruitment) => (
                  <PreviousRecruitmentItem
                    key={recruitment.id}
                    recruitment={recruitment}
                    isExpanded={expandedId === recruitment.id}
                    onPress={() =>
                      setExpandedId((current) =>
                        getNextExpandedRecruitmentId(current, recruitment.id),
                      )
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default PreviousRecruitmentsPage
