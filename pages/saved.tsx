import Head from 'next/head'
import { useEffect } from 'react'
import { useProfile, useRequireLogin } from '../src/club/auth/AuthContext'
import { AppTabBar } from '../src/club/components/AppTabBar'
import { ClubCard, ClubCardSkeleton } from '../src/club/components/ClubCard'
import { useSavedClubs } from '../src/club/useSaveClub'

// 앱 SavedClubListScreen과 동일: 중앙 타이틀 헤더(뒤로가기 없음) + 카드 목록
const SavedClubListPage = () => {
  const { user, isLoading: isProfileLoading } = useProfile()
  const requireLogin = useRequireLogin()
  const { data, isLoading } = useSavedClubs()

  // 앱은 탭 진입 자체를 로그인으로 게이트 — 웹은 비로그인 접근 시 로그인 시트 표시
  useEffect(() => {
    if (!isProfileLoading && !user) {
      requireLogin(() => {})
    }
  }, [isProfileLoading, user, requireLogin])

  const clubs = data?.clubs

  return (
    <>
      <Head>
        <title>저장한 동아리 - 서울대 모든 동아리 올클리어</title>
      </Head>

      <div className="min-h-screen bg-[#FAFAFA] font-pretendard text-[#202020]">
        <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col pb-[86px]">
          <div className="relative flex h-14 w-full items-center px-4">
            <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-[16px] font-semibold text-[#757474]">
              저장한 동아리
            </p>
          </div>

          {!user ? (
            <div className="flex flex-1 flex-col items-center justify-center">
              <p className="text-center text-[12px] font-normal leading-[18px] text-[#757474]">
                저장한 동아리를 보려면 로그인이 필요해요
              </p>
              <button
                type="button"
                onClick={() => requireLogin(() => {})}
                className="mt-3 text-[14px] font-semibold text-[#202020] underline active:opacity-40"
              >
                로그인 하러 가기
              </button>
            </div>
          ) : isLoading ? (
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
                저장한 동아리가 없어요
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-[25px] px-5 pb-5 pt-2">
              {(clubs ?? []).map((club) => (
                <ClubCard key={club.uuid} club={club} />
              ))}
            </div>
          )}
        </div>

        <AppTabBar active="saved" />
      </div>
    </>
  )
}

export default SavedClubListPage
