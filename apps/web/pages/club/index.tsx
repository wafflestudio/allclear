import Head from 'next/head'
import Link from 'next/link'
import { useLatestClubs } from '../../src/club/api/clubs'
import { AppTabBar } from '../../src/club/shared/components/AppTabBar'
import { ClubPreviewCardSkeleton } from '../../src/club/shared/components/ClubPreviewCard'
import { HorizontalCarousel } from '../../src/club/shared/components/HorizontalCarousel'
import {
  CategoryIconMap,
  type CategoryName,
  CLUB_CATEGORY_NAMES,
} from '../../src/club/shared/constants'

// 앱 HomeScreen과 동일한 구성: 헤더(문구 + 로고) → 카테고리 섹션 → 최신 공고 캐러셀
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
          섹션 사이 여백(17 / 50)은 화면이 낮으면 min까지 줄어들고, 그래도 넘치면 내부 스크롤로 폴백. */}
      {/* h-screen은 globals.css에서 dvh + 앱 배너 높이를 반영하도록 확장해두었다 */}
      <div className="h-screen bg-[#FAFAFA] font-pretendard text-[#202020]">
        <main className="scrollbar-hide mx-auto flex h-full w-full max-w-[480px] flex-col items-center overflow-y-auto pt-3">
          {/* 상단 헤더 (앱 headerContainer: 폭 353, 왼쪽 4, 아래 17) */}
          <div className="w-full shrink-0 px-[18px]">
            <div className="ml-1 flex flex-col items-start">
              <p className="text-[14px] font-semibold leading-[17px] text-[#874FFF]">
                이번 학기엔 동아리까지,
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icons/category-home/header-logo.png"
                alt="올클리어"
                width={119}
                height={40}
                className="mt-1.5 h-10 w-[119px] object-contain"
              />
            </div>
          </div>

          <div className="h-[17px] min-h-[8px] w-full shrink" />

          {/* 카테고리 섹션 (앱 categoryContainer: 아래 50) */}
          <div className="w-full shrink-0 px-[18px]">
            <h2 className="mb-4 ml-1 text-[20px] font-semibold leading-6 text-[#757474]">
              어떤 동아리든 올클과 함께 찾아봐요
            </h2>
            {/* 앱 CategorySection: 높이 277, radius 16, bg #F3F0F5, 좌우 24 / 위아래 20, 그림자 0 2 4 0.12 */}
            <div className="flex h-[277px] flex-col justify-center rounded-2xl bg-[#F3F0F5] px-6 py-5 shadow-[0_2px_4px_rgba(0,0,0,0.12)]">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex min-w-0 shrink items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/icons/category-home/category-title.png"
                    alt=""
                    width={47}
                    height={46}
                    className="mx-2 h-[46px] w-[47px] shrink-0 object-contain"
                  />
                  <div className="flex min-w-0 flex-col justify-center">
                    <p className="text-[12px] font-normal leading-[18px] text-[#757474]">
                      원하는 활동이 있으신가요?
                    </p>
                    <p className="text-[20px] font-bold leading-6 text-[#202020]">
                      <span className="text-[#874FFF]">카테고리 </span>모아보기
                    </p>
                  </div>
                </div>
                <CategoryCard name={firstCategory} />
              </div>
              {/* 앱 grid: 가로 간격 8 / 세로 간격 12 (4열). 좁은 화면에서도 4열이 유지되도록 양끝 정렬 */}
              <div className="flex flex-wrap justify-between gap-y-3">
                {restCategories.map((name) => (
                  <CategoryCard key={name} name={name} />
                ))}
              </div>
            </div>
          </div>

          <div className="h-[50px] min-h-[16px] w-full shrink" />

          {/* 최신 공고 섹션 (앱 latestClubsContainer) */}
          <div className="w-full shrink-0">
            <h2 className="mb-4 ml-5 text-[20px] font-semibold leading-6 text-[#757474]">
              새로운 공고가 올라왔어요
            </h2>
            {isLoading ? (
              <div className="-mb-2 -mt-2 flex w-full gap-2.5 overflow-hidden px-5 pb-[10px] pt-2">
                {Array.from({ length: 4 }, (_, i) => (
                  <ClubPreviewCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <HorizontalCarousel clubs={latestClubs ?? []} />
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

// 앱 CategoryCard와 동일: 70×70 흰색 카드, radius 10, 아이콘 30×30(위아래 5), 라벨 12/500 #757474, 누르면 0.6
function CategoryCard({ name }: { name: CategoryName }) {
  return (
    <Link
      href={`/club/category/${encodeURIComponent(name)}`}
      className="flex h-[70px] w-[70px] shrink-0 flex-col items-center justify-center rounded-[10px] bg-white active:opacity-60"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={CategoryIconMap[name]}
        alt=""
        width={30}
        height={30}
        className="my-[5px] h-[30px] w-[30px] object-contain"
      />
      <span className="text-[12px] font-medium leading-[14px] text-[#757474]">{name}</span>
    </Link>
  )
}

export default ClubHomePage
