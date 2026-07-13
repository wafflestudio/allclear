import Head from 'next/head'
import { useRouter } from 'next/router'
import { useClubsByCategory } from '../../../src/club/api'
import { AppTabBar } from '../../../src/club/components/AppTabBar'
import { BackHeader } from '../../../src/club/components/BackHeader'
import { ClubCard, ClubCardSkeleton } from '../../../src/club/components/ClubCard'

// 앱 ClubListScreen과 동일: BackHeader + 카드 목록 (gap 25, px 20)
const ClubListPage = () => {
  const router = useRouter()
  const category = typeof router.query.category === 'string' ? router.query.category : undefined
  const { data: clubs, isLoading } = useClubsByCategory(category)

  return (
    <>
      <Head>
        <title>{`${category ?? ''} 동아리 - 서울대 모든 동아리 올클리어`}</title>
      </Head>

      <div className="min-h-screen bg-[#FAFAFA] font-pretendard text-[#202020]">
        <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col pb-[86px]">
          <BackHeader title={`${category ?? ''} 동아리`} onBack={() => router.push('/club')} />

          {isLoading || !category ? (
            <div className="flex flex-col gap-[25px] px-5 py-2">
              {Array.from({ length: 6 }, (_, i) => (
                <ClubCardSkeleton key={i} />
              ))}
            </div>
          ) : (clubs ?? []).length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/not-found.png" alt="" width={122} height={99} />
              <p className="mt-5 text-center text-[12px] font-normal leading-[18px] text-[#202020]">
                조건에 맞는 동아리가 없어요
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-[25px] px-5 pb-5 pt-2">
              {(clubs ?? []).map((club) => (
                <ClubCard key={club.uuid} club={club} useCategoryTheme />
              ))}
            </div>
          )}
        </div>

        <AppTabBar active="home" />
      </div>
    </>
  )
}

export default ClubListPage
