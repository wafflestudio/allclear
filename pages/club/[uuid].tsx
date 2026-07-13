import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { EntityNotFoundError } from 'typeorm'
import { z } from 'zod'
import { Provider } from 'server/provider'
import { ClubServiceV1 } from 'server/service/v1/club.service'
import type { V1Club } from 'server/service/v1/club.service'
import { OpenGraph } from '../../src/common/components/OpenGraph'
import { BackgroundCard } from '../../src/club/components/BackgroundCard'
import { ClubDetailTabBar, ClubTabKey } from '../../src/club/components/ClubDetailTabBar'
import { InfoTab } from '../../src/club/components/InfoTab'
import { MdiIcon } from '../../src/club/components/icons'
import { RecruitTab } from '../../src/club/components/RecruitTab'
import { ReviewKeywordPill } from '../../src/club/components/ReviewKeywordPill'
import { ReviewTab } from '../../src/club/components/ReviewTab'
import { getCategoryTheme } from '../../src/club/constants'
import { openClubInApp } from '../../src/club/openInApp'

// 앱에서 모집공고/활동후기는 로그인이 필요하므로, 웹에서도 동일하게 앱 설치/로그인으로 유도한다.
// 웹에서 전부 공개하려면 false로 변경.
const GATE_RECRUIT_AND_REVIEW = true

type Props = {
  club: V1Club
}

const ClubDetailPage = ({ club }: Props) => {
  const [activeTab, setActiveTab] = useState<ClubTabKey>('detail')
  const theme = getCategoryTheme(club.category)

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: club.name,
          text: `${club.name}의 동아리 정보를 확인해보세요!`,
          url,
        })
      } catch {
        // 사용자가 공유를 취소한 경우
      }
      return
    }
    await navigator.clipboard.writeText(url)
    toast.success('링크를 복사했어요!')
  }

  return (
    <>
      <Head>
        <title>{`${club.name} - 서울대 모든 동아리 올클리어`}</title>
        <meta name="description" content={club.description} />
      </Head>
      <OpenGraph
        container={Head}
        title={club.name}
        description={club.description}
        imageUrl={club.imageUri}
      />

      <div className="min-h-screen bg-[#FAFAFA] font-pretendard text-[#202020]">
        <main className="mx-auto w-full max-w-[480px] pb-32">
          {/* 로고 배너 */}
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

          {/* 히어로 카드 */}
          <div className="relative -mt-[72px] mx-4 mb-3">
            <BackgroundCard>
              <div className="mb-1.5 flex items-center justify-between">
                <h1 className="min-w-0 truncate text-[20px] font-bold text-[#202020]">
                  {club.name}
                </h1>
                <div className="ml-3 flex shrink-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={handleShare}
                    aria-label="공유하기"
                    className="text-[#874FFF] active:opacity-50"
                  >
                    <MdiIcon name="shareVariant" size={22} />
                  </button>
                </div>
              </div>
              <p className="mb-2.5 text-[14px] font-normal text-[#757474]">{club.description}</p>
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
            </BackgroundCard>
          </div>

          {/* 탭바 (스크롤 시 상단 고정) */}
          <div className="sticky top-0 z-20">
            <ClubDetailTabBar activeTab={activeTab} onChange={setActiveTab} />
          </div>

          {/* 탭 콘텐츠 */}
          <div className="px-4">
            {activeTab === 'detail' && <InfoTab club={club} />}
            {activeTab === 'recruit' && <RecruitTab club={club} gated={GATE_RECRUIT_AND_REVIEW} />}
            {activeTab === 'review' && <ReviewTab club={club} gated={GATE_RECRUIT_AND_REVIEW} />}
          </div>
        </main>

        {/* 하단 고정 앱 유도 CTA */}
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
    const clubService = Provider.getService(ClubServiceV1)
    const club = await clubService.findByUuid(uuid.data)
    return {
      props: {
        club: {
          ...club,
          // 타입은 string이지만 런타임엔 TypeORM이 Date를 반환하므로 직렬화 필요
          articleUploadedAt: club.articleUploadedAt
            ? new Date(club.articleUploadedAt).toISOString()
            : null,
        },
      },
    }
  } catch (err) {
    if (err instanceof EntityNotFoundError) {
      return { notFound: true }
    }
    throw err
  }
}

export default ClubDetailPage
