import Head from 'next/head'
import { useRouter } from 'next/router'
import { useClubsByCategory } from '../../../src/club/api/clubs'
import { ClubList } from '../../../src/club/features/club/list/ClubCard'
import { AppTabBar } from '../../../src/club/shared/components/AppTabBar'
import { BackHeader } from '../../../src/club/shared/components/BackHeader'

// 앱 ClubListScreen과 동일: BackHeader("{카테고리} 동아리", 뒤로 → 홈) + 카테고리 테마의 카드 목록
// (로딩: 스켈레톤 / 0건: "조건에 맞는 동아리가 없어요")
const ClubListPage = () => {
  const router = useRouter()
  const category = typeof router.query.category === 'string' ? router.query.category : undefined
  const { data: clubs, isLoading } = useClubsByCategory(category)

  const headerTitle = `${category ?? ''} 동아리`

  return (
    <>
      <Head>
        <title>{`${headerTitle} - 서울대 모든 동아리 올클리어`}</title>
      </Head>

      <div className="min-h-screen bg-[#FAFAFA] font-pretendard text-[#202020]">
        <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col pb-[86px]">
          <BackHeader title={headerTitle} onBack={() => router.push('/club')} />
          {/* 앱은 category 가 없으면 아무것도 그리지 않는다 (라우터 준비 전에는 스켈레톤) */}
          {category ? (
            <ClubList
              clubs={clubs}
              useCategoryTheme
              emptyPlaceholder="조건에 맞는 동아리가 없어요"
              isLoading={isLoading}
            />
          ) : (
            <ClubList clubs={undefined} emptyPlaceholder="" isLoading />
          )}
        </div>

        <AppTabBar active="home" />
      </div>
    </>
  )
}

export default ClubListPage
