import Head from 'next/head'
import React, { useEffect, useState } from 'react'

export const AdminLoginPage = () => {
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  useEffect(() => {
    const handlePageShow = () => setIsLoggingIn(false)
    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [])

  const handleKakaoLogin = () => {
    setIsLoggingIn(true)
    window.location.assign('/api/v2/auth/kakao?state=admin')
  }

  return (
    <>
      <Head>
        <title>올클 운영진 로그인</title>
      </Head>
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-950">
        <section className="w-full max-w-md rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-primary-700">Allclear Admin</p>
          <h1 className="mt-2 text-2xl font-bold">운영진 로그인</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            카카오 계정으로 로그인한 뒤 운영진 권한이 확인되면 대시보드를 사용할 수 있습니다.
          </p>

          <button
            type="button"
            onClick={handleKakaoLogin}
            disabled={isLoggingIn}
            className="mt-6 flex min-h-[48px] w-full items-center justify-center rounded-md bg-[#FEE500] px-4 text-sm font-bold text-[#191919] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoggingIn ? '카카오 로그인 진행 중' : '카카오로 로그인'}
          </button>

          <p className="mt-5 text-xs leading-5 text-slate-500">
            기존 인증 API를 그대로 사용하며, 로그인 토큰은 이 브라우저의 로컬 저장소에 보관됩니다.
          </p>
        </section>
      </main>
    </>
  )
}
