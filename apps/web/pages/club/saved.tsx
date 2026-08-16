import Head from 'next/head'
import { useEffect } from 'react'
import { useProfile, useRequireLogin } from '../../src/club/auth/AuthContext'
import { ClubList } from '../../src/club/features/club/list/ClubCard'
import { AppTabBar } from '../../src/club/shared/components/AppTabBar'
import { BackHeader } from '../../src/club/shared/components/BackHeader'
import { useSavedClubs } from '../../src/club/shared/hooks/useSaveClub'

// 앱 SavedClubListScreen과 동일: 가운데 타이틀 헤더("저장한 동아리", 뒤로가기 없음) + 카드 목록
// (로딩: 스켈레톤 / 0건: "저장한 동아리가 없어요")
const SavedClubListPage = () => {
  const { user, isLoading: isProfileLoading } = useProfile()
  const requireLogin = useRequireLogin()
  const { data, isLoading } = useSavedClubs()

  // 앱은 탭 진입 자체를 로그인으로 게이트한다(AppTabBar 도 동일). URL로 직접 들어온 비로그인 사용자에게는
  // 로그인 시트를 띄운다.
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
          <BackHeader title="저장한 동아리" onBack={() => {}} showBackButton={false} />

          {!isProfileLoading && !user ? (
            /* 웹 전용 폴백: 앱에서는 로그인 없이는 이 화면에 들어올 수 없다 */
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
          ) : (
            <ClubList
              clubs={clubs}
              emptyPlaceholder="저장한 동아리가 없어요"
              isLoading={isProfileLoading || isLoading}
            />
          )}
        </div>

        <AppTabBar active="saved" />
      </div>
    </>
  )
}

export default SavedClubListPage
