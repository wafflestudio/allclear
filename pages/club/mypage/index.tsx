import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useQueryClient } from 'react-query'
import { toast } from 'react-toastify'
import { useProfile, useRequireLogin } from '../../../src/club/auth/AuthContext'
import { authFetch, clearLoginToken } from '../../../src/club/auth/token'
import { AlertModal } from '../../../src/club/components/AlertModal'
import { AppTabBar } from '../../../src/club/components/AppTabBar'
import { openAppDeepLink } from '../../../src/club/openInApp'

// 앱 MyPageScreen과 동일: bg #F3F0F5, 프로필 카드 → 운영진 카드 → 메뉴 카드 → 계정 카드
const MyPage = () => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, isLoading, setUser, logout } = useProfile()
  const requireLogin = useRequireLogin()
  const [modal, setModal] = useState<'logout' | 'leave' | null>(null)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      requireLogin(() => {})
    }
  }, [isLoading, user, requireLogin])

  const confirmLogout = () => {
    setModal(null)
    logout()
    router.push('/club')
  }

  const confirmLeave = async () => {
    setIsLeaving(true)
    try {
      await authFetch<void>('/api/v2/auth/leave', { method: 'POST' })
    } catch {
      toast.error('탈퇴 처리 중 오류가 발생했어요')
      setIsLeaving(false)
      setModal(null)
      return
    }
    clearLoginToken()
    setUser(null)
    queryClient.clear()
    setIsLeaving(false)
    setModal(null)
    router.push('/club')
    toast.info('회원 탈퇴 되었어요!')
  }

  const collegeLine = user?.college
    ? user.major
      ? `${user.college} ${user.major}`
      : user.college
    : '단과대 정보가 없습니다'
  const admissionLine =
    user?.admissionClass != null
      ? `${String(user.admissionClass).padStart(2, '0')}학번`
      : '학번 정보가 없습니다'

  return (
    <>
      <Head>
        <title>마이페이지 - 서울대 모든 동아리 올클리어</title>
      </Head>

      <div className="min-h-screen bg-[#F3F0F5] font-pretendard text-[#202020]">
        <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col gap-3 p-4 pb-[110px]">
          {!user ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-xl bg-white py-16">
              <p className="text-center text-[12px] font-normal leading-[18px] text-[#757474]">
                마이페이지를 보려면 로그인이 필요해요
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
            <>
              {/* 프로필 카드 */}
              <div className="relative rounded-xl bg-white px-6 py-5">
                <Link
                  href="/club/mypage/edit"
                  aria-label="프로필 수정"
                  className="absolute right-5 top-5 active:opacity-50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icons/edit-pencil.png" alt="" width={22} height={22} />
                </Link>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/mypage/snu-logo.png" alt="" width={48} height={48} />
                <p className="mt-2.5 text-[20px] font-bold text-[#202020]">
                  {user.nickname || '이름 정보가 없습니다'}
                </p>
                <p className="mt-1.5 text-[14px] font-normal text-[#757474]">{collegeLine}</p>
                <p className="mt-1.5 text-[14px] font-normal text-[#757474]">{admissionLine}</p>
              </div>

              {/* 운영진 카드 — 등록/관리는 앱에서 */}
              <button
                type="button"
                onClick={() => openAppDeepLink()}
                className="rounded-xl bg-[#FAFAFA] px-6 py-5 text-left active:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[14px] font-medium tracking-[-0.28px] text-[#874FFF]">
                      동아리 운영진이신가요?
                    </p>
                    <p className="mt-1 text-[12px] font-normal tracking-[-0.24px] text-[#874FFF] opacity-40">
                      신규 동아리 등록하기
                    </p>
                  </div>
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="#874FFF" aria-hidden="true">
                    <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" />
                  </svg>
                </div>
              </button>

              {/* 기타 메뉴 카드 */}
              <div className="rounded-xl bg-white px-6 py-5">
                <a
                  href="https://tally.so/r/woegzN"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block py-2.5 text-[14px] font-normal text-[#757474] active:opacity-50"
                >
                  개발자에게 요청하기
                </a>
                <Link
                  href="/terms/terms-of-service"
                  className="block py-2.5 text-[14px] font-normal text-[#757474] active:opacity-50"
                >
                  서비스 이용약관
                </Link>
                <Link
                  href="/terms/privacy-policy"
                  className="block py-2.5 text-[14px] font-normal text-[#757474] active:opacity-50"
                >
                  개인정보 처리방침
                </Link>
              </div>

              {/* 계정 메뉴 카드 */}
              <div className="rounded-xl bg-white px-6 py-5">
                <button
                  type="button"
                  onClick={() => setModal('logout')}
                  className="block w-full py-2.5 text-left text-[14px] font-normal text-[#757474] active:opacity-50"
                >
                  로그아웃
                </button>
                <button
                  type="button"
                  onClick={() => setModal('leave')}
                  className="block w-full py-2.5 text-left text-[14px] font-normal text-[#757474] active:opacity-50"
                >
                  회원 탈퇴
                </button>
              </div>
            </>
          )}
        </div>

        <AppTabBar active="mypage" />
      </div>

      {modal === 'logout' && (
        <AlertModal
          title="로그아웃"
          description="로그아웃 하시겠습니까?"
          buttonLabel="로그아웃"
          hasCancel
          onConfirm={confirmLogout}
          onCancel={() => setModal(null)}
        />
      )}
      {modal === 'leave' && (
        <AlertModal
          title="회원 탈퇴"
          description="정말로 탈퇴하시겠습니까?"
          buttonLabel="탈퇴"
          buttonVariant="destructive"
          hasCancel
          isSubmitting={isLeaving}
          onConfirm={confirmLeave}
          onCancel={() => setModal(null)}
        />
      )}
    </>
  )
}

export default MyPage
