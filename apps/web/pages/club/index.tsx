import Head from 'next/head'
import Link from 'next/link'
import { useLatestClubs } from '../../src/club/api'
import { AppTabBar } from '../../src/club/components/AppTabBar'
import { ClubPreviewCard, ClubPreviewCardSkeleton } from '../../src/club/components/ClubPreviewCard'
import { HorizontalCarousel } from '../../src/club/components/HorizontalCarousel'
import { CategoryIconMap, CLUB_CATEGORY_NAMES } from '../../src/club/constants'

// 앱 HomeScreen과 동일한 구성: 헤더 → 카테고리 섹션 → 최신 공고 캐러셀
const ClubHomePage = () => {
  const { data: latestClubs, isLoading } = useLatestClubs()

  const [firstCategory, ...restCategories] = CLUB_CATEGORY_NAMES

  return (
    <>
      <Head>
        <title>서울대 모든 동아리 - 한 번에 올클하기</title>
        <meta name="description" content="스랖 에타 eTL 올클 렛츠고 🥳" />
      </Head>

      {/* 앱 홈과 동일하게 뷰포트에 꽉 차는 고정 화면 (페이지 스크롤 없음).
          섹션 사이 여백은 화면이 낮으면 min까지 줄어들고, 그래도 넘치면 내부 스크롤로 폴백. */}
      <div
        className="h-screen bg-[#FAFAFA] font-pretendard text-[#202020]"
        style={{ height: '100dvh' }}
      >
        <main className="scrollbar-hide mx-auto flex h-full w-full max-w-[480px] flex-col items-center overflow-y-auto pt-8">
          {/* 상단 헤더 */}
          <div className="w-full shrink-0 px-[18px]">
            <div className="ml-1">
              <p className="text-[12px] font-medium text-[#202020]">서울대 모든 동아리</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/header/allclear.png"
                alt="올클리어"
                width={106}
                height={34}
                className="mt-1.5 object-contain"
              />
            </div>
          </div>

          <div className="h-10 min-h-[24px] w-full shrink" />

          {/* 카테고리 섹션 */}
          <div className="w-full shrink-0 px-[18px]">
            <h2 className="mb-4 ml-1 text-[20px] font-semibold leading-6 text-[#757474]">
              어떤 동아리든 올클과 함께 찾아봐요
            </h2>
            <div className="flex min-h-[277px] flex-col justify-center rounded-2xl bg-[#F3F0F5] px-6 py-5 shadow-[0_2px_4px_rgba(0,0,0,0.12)]">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex min-w-0 items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/icons/category-title.png"
                    alt=""
                    width={44}
                    height={42}
                    className="mx-2 shrink-0 object-contain"
                  />
                  <div className="min-w-0">
                    <p className="text-[12px] font-normal leading-[18px] text-[#757474]">
                      원하는 활동이 있으신가요?
                    </p>
                    <p className="text-[20px] font-bold text-[#202020]">
                      <span className="text-[#874FFF]">카테고리 </span>모아보기
                    </p>
                  </div>
                </div>
                <CategoryCard name={firstCategory} />
              </div>
              <div className="flex flex-wrap gap-x-2 gap-y-3">
                {restCategories.map((name) => (
                  <CategoryCard key={name} name={name} />
                ))}
              </div>
            </div>
          </div>

          <div className="h-[30px] min-h-[16px] w-full shrink" />

          {/* 최신 공고 섹션 */}
          <div className="w-full shrink-0">
            <h2 className="mb-4 ml-5 text-[20px] font-semibold leading-6 text-[#757474]">
              새로운 공고가 올라왔어요
            </h2>
            {isLoading ? (
              <div className="flex w-full gap-2.5 overflow-hidden px-5 pb-0.5">
                {Array.from({ length: 4 }, (_, i) => (
                  <ClubPreviewCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <HorizontalCarousel>
                {(latestClubs ?? []).map((club) => (
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

          {/* 하단 탭바(86px) 클리어런스 — 내부 스크롤 시에도 카드가 탭바에 가리지 않게 유지 */}
          <div className="h-[110px] min-h-[90px] w-full shrink" />
        </main>

        <AppTabBar active="home" />
      </div>
    </>
  )
}

// 앱 CategoryCard와 동일: 70×70 흰색 카드, radius 10, 아이콘 30×30, 라벨 12/500
function CategoryCard({ name }: { name: string }) {
  return (
    <Link
      href={`/club/category/${encodeURIComponent(name)}`}
      className="flex h-[70px] w-[70px] shrink-0 flex-col items-center justify-center rounded-[10px] bg-white active:opacity-60"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={CategoryIconMap[name as keyof typeof CategoryIconMap]}
        alt=""
        width={30}
        height={30}
        className="my-[5px] object-contain"
      />
      <span className="text-[12px] font-medium text-[#757474]">{name}</span>
    </Link>
  )
}

export default ClubHomePage
