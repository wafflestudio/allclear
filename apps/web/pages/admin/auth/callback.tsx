import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useEffect, useRef, useState } from 'react'
import { verifyAdminRole } from 'src/admin/api'
import { ADMIN_AUTH_TOKEN_KEY } from 'src/admin/constants'

const getTokenFromHash = () => {
  const hash = window.location.hash.replace(/^#/, '')
  return new URLSearchParams(hash).get('token')
}

const AdminAuthCallbackPage = () => {
  const router = useRouter()
  const handledRef = useRef(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (handledRef.current) return
    handledRef.current = true

    const token = getTokenFromHash()
    window.history.replaceState(null, '', '/admin/auth/callback')

    if (!token) {
      setErrorMessage('로그인 토큰을 확인할 수 없습니다. 다시 로그인해주세요.')
      return
    }

    const completeLogin = async () => {
      try {
        await verifyAdminRole(token)
        window.localStorage.setItem(ADMIN_AUTH_TOKEN_KEY, token)
        await router.replace('/admin')
      } catch {
        window.localStorage.removeItem(ADMIN_AUTH_TOKEN_KEY)
        setErrorMessage('운영진 권한이 없습니다. 올클 운영진 계정으로 로그인해주세요.')
      }
    }

    void completeLogin()
  }, [router])

  const handleRetry = () => {
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
          <h1 className="mt-2 text-2xl font-bold">
            {errorMessage ? '로그인 실패' : '로그인 처리 중'}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {errorMessage || '운영진 권한을 확인하고 있습니다.'}
          </p>

          {errorMessage && (
            <button
              type="button"
              onClick={handleRetry}
              className="mt-6 flex min-h-[48px] w-full items-center justify-center rounded-md bg-[#FEE500] px-4 text-sm font-bold text-[#191919]"
            >
              카카오로 다시 로그인
            </button>
          )}
        </section>
      </main>
    </>
  )
}

export default AdminAuthCallbackPage
