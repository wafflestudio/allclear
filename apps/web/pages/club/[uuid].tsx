import type { GetServerSideProps } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useRef, useState } from 'react'
import { toast } from 'react-toastify'
import { NotFoundError } from 'server/domain/error'
import type { ClubDetail } from 'server/domain/model/Club'
import { Provider } from 'server/provider'
import { ClubService } from 'server/service/club.service'
import { z } from 'zod'
import { useProfile, useRequireLogin } from '../../src/club/auth/AuthContext'
import { BackgroundCard } from '../../src/club/features/club/detail/BackgroundCard'
import {
  ClubDetailHeader,
  DETAIL_HEADER_HEIGHT,
} from '../../src/club/features/club/detail/ClubDetailHeader'
import {
  CLUB_DETAIL_TABS,
  ClubDetailTabBar,
  type ClubTabKey,
} from '../../src/club/features/club/detail/ClubDetailTabBar'
import { InfoTab } from '../../src/club/features/club/detail/InfoTab'
import { RecruitTab } from '../../src/club/features/club/detail/RecruitTab'
import { ReviewTab } from '../../src/club/features/club/detail/ReviewTab'
import { SnsRow } from '../../src/club/features/club/detail/SnsRow'
import { VerificationMarkButton } from '../../src/club/features/club/detail/VerificationMark'
import { VerificationOverlay } from '../../src/club/features/club/detail/VerificationOverlay'
import { MdiIcon } from '../../src/club/shared/components/icons'
import { ReviewKeywordPill } from '../../src/club/shared/components/ReviewKeywordPill'
import { getCategoryTheme } from '../../src/club/shared/constants'
import { useSaveClub } from '../../src/club/shared/hooks/useSaveClub'
import { getClubSummaryWithAffiliation } from '../../src/club/shared/utils/club'
import { getClubSnsUrls } from '../../src/club/shared/utils/clubSns'
import { OpenGraph } from '../../src/club/web/OpenGraph'
import { openClubInApp } from '../../src/club/web/openInApp'

type Props = {
  club: ClubDetail
}

/**
 * 앱 ClubDetailScreen 의 웹 미러.
 * 로고 배너(300, 상하 페이드) → 히어로 카드(-72 겹침) → 탭바(스크롤 시 헤더 아래 고정) → 탭 콘텐츠.
 * 헤더는 항상 떠 있고 스크롤에 따라 배경이 채워지며, 탭바가 고정되는 순간 동아리명이 노출된다 (ClubDetailHeader).
 */
const ClubDetailPage = ({ club }: Props) => {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<ClubTabKey>('detail')
  const [isVerificationOverlayVisible, setIsVerificationOverlayVisible] = useState(false)
  const tabBarRef = useRef<HTMLDivElement>(null)
  const theme = getCategoryTheme(club.category)
  const { user } = useProfile()
  const { isSaved, toggle: toggleSave } = useSaveClub(club)
  const requireLogin = useRequireLogin()
  const verificationStatus = club.officialVerificationStatus
  const heroDescription = getClubSummaryWithAffiliation(club)
  const snsUrls = getClubSnsUrls(club)

  const handleWriteReview = () => {
    requireLogin(() => router.push(`/club/${club.uuid}/review`))
  }

  const handlePreviousRecruitments = (representativeRecruitmentId: number | null) => {
    const query =
      representativeRecruitmentId === null ? '' : `?representative=${representativeRecruitmentId}`
    router.push(`/club/${club.uuid}/recruitments${query}`)
  }

  const handleLoginRequired = () => {
    requireLogin(() => {})
  }

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/club/${club.uuid}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: club.name,
          text: `${club.name}의 동아리 정보를 확인해보세요!`,
          url: shareUrl,
        })
      } catch {
        // 사용자가 공유를 취소한 경우
      }
      return
    }
    await navigator.clipboard.writeText(shareUrl)
    toast.success('링크를 복사했어요!')
  }

  return (
    <>
      <Head>
        <title>{`${club.name} - 서울대 모든 동아리 올클리어`}</title>
        <meta name="description" content={heroDescription || club.description} />
      </Head>
      <OpenGraph
        container={Head}
        title={club.name}
        description={heroDescription || club.description}
        imageUrl={club.imageUri}
      />

      <div className="min-h-screen bg-[#FAFAFA] font-pretendard text-[#202020]">
        <ClubDetailHeader title={club.name} tabBarRef={tabBarRef} />

        <main className="mx-auto w-full max-w-[480px] pb-32">
          {/* 로고 배너: 상/하단은 배경색(#FAFAFA)으로 완전히 덮고, 중앙은 30% 베일 */}
          <div className="relative h-[300px] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={club.imageUri}
              alt={`${club.name} 로고`}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, #FAFAFA 2.95%, rgba(250,250,250,0.3) 39.9%, rgba(250,250,250,0.3) 60.6%, #FAFAFA 83.72%)',
              }}
            />
          </div>

          {/* 히어로 카드: 로고 하단을 72px 덮고 올라온다 */}
          <div className="relative -mt-[72px] mx-4 mb-3">
            <BackgroundCard className="overflow-visible">
              <div className="mb-1.5 flex items-center justify-between">
                <div className="flex min-w-0 shrink items-center gap-1">
                  <h1 className="min-w-0 truncate text-[20px] font-bold text-[#202020]">
                    {club.name}
                  </h1>
                  <VerificationMarkButton
                    status={verificationStatus}
                    onPress={() => setIsVerificationOverlayVisible((prev) => !prev)}
                  />
                </div>
                <div className="ml-3 flex shrink-0 items-center gap-2.5">
                  <button
                    type="button"
                    onClick={toggleSave}
                    aria-label={isSaved ? '저장 취소' : '동아리 저장'}
                    className="flex items-center active:opacity-50"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={isSaved ? '/icons/heart-fill.png' : '/icons/heart.png'}
                      alt=""
                      width={18}
                      height={18}
                      className="h-[18px] w-[18px] object-contain"
                    />
                  </button>
                  <button
                    type="button"
                    onClick={handleShare}
                    aria-label="동아리 공유"
                    className="flex items-center text-[#874FFF] active:opacity-50"
                  >
                    <MdiIcon name="shareVariant" size={18} />
                  </button>
                </div>
              </div>
              {/* 인증 안내 말풍선: 카드 오른쪽 위, 카드 상단에서 8px 위에 떠 있다 (앱과 동일) */}
              <VerificationOverlay
                status={verificationStatus}
                visible={isVerificationOverlayVisible}
                className="absolute right-0 top-0"
                style={{ transform: 'translateY(calc(-100% - 8px))' }}
              />
              {!!heroDescription && (
                <p className="mb-2.5 text-[14px] font-normal text-[#757474]">{heroDescription}</p>
              )}
              {club.reviewKeywords.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {club.reviewKeywords.slice(0, 2).map((keyword) => (
                    <ReviewKeywordPill
                      key={keyword.id}
                      iconUri={keyword.iconUri}
                      title={keyword.title}
                      theme={theme}
                    />
                  ))}
                </div>
              )}
              <SnsRow clubName={club.name} snsUrls={snsUrls} />
            </BackgroundCard>
          </div>

          {/* 탭바: 스크롤 시 헤더 아래에 핀 고정 (앱의 pinned 탭바와 동일).
              ClubDetailHeader가 핀 여부를 같은 값으로 계산하므로 상수를 공유한다 */}
          <div
            ref={tabBarRef}
            className="sticky z-20"
            style={{ top: `calc(${DETAIL_HEADER_HEIGHT}px + var(--app-banner-h, 0px))` }}
          >
            <ClubDetailTabBar activeTab={activeTab} onChange={setActiveTab} />
          </div>

          {/* 탭 콘텐츠 */}
          <div className="px-4">
            {activeTab === 'detail' && <InfoTab club={club} />}
            {activeTab === 'recruit' && (
              <RecruitTab
                club={club}
                tabLabel={CLUB_DETAIL_TABS[activeTab]}
                isLoggedIn={!!user}
                onLoginPress={handleLoginRequired}
                onPreviousPress={handlePreviousRecruitments}
              />
            )}
            {activeTab === 'review' && (
              <ReviewTab
                club={club}
                tabLabel={CLUB_DETAIL_TABS[activeTab]}
                theme={theme}
                isLoggedIn={!!user}
                onLoginPress={handleLoginRequired}
                onWriteReview={handleWriteReview}
              />
            )}
          </div>
        </main>

        {/* 하단 고정 앱 유도 CTA (웹 전용) */}
        <div className="fixed inset-x-0 bottom-0 z-30">
          <div className="mx-auto max-w-[480px] bg-gradient-to-t from-[#FAFAFA] via-[#FAFAFA]/80 to-transparent px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-6">
            <button
              type="button"
              onClick={() => openClubInApp(club.uuid)}
              className="h-12 w-full rounded-xl bg-[#874FFF] text-[16px] font-semibold text-white active:bg-[#4F2E94]"
            >
              올클리어 앱에서 보기
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ params }) => {
  const uuid = z.string().uuid().safeParse(params?.uuid)
  if (!uuid.success) {
    return { notFound: true }
  }

  try {
    const clubService = Provider.getService(ClubService)
    // v2: APPROVED 상태의 공개 동아리만 노출 (officialVerificationStatus 포함)
    const club = await clubService.findPublicByUuid(uuid.data)
    return {
      props: {
        club: {
          ...club,
          // 타입은 string이지만 런타임엔 TypeORM이 Date를 반환하므로 직렬화 필요
          articleUploadedAt: club.articleUploadedAt
            ? new Date(club.articleUploadedAt).toISOString()
            : null,
          verifiedAt: club.verifiedAt ? new Date(club.verifiedAt).toISOString() : null,
        },
      },
    }
  } catch (err) {
    if (err instanceof NotFoundError) {
      return { notFound: true }
    }
    throw err
  }
}

export default ClubDetailPage
