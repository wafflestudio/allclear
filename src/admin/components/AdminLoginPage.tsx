import Head from 'next/head'
import React, { useState } from 'react'

const extractTokenFromPopupText = (rawText: string): string | null => {
  try {
    const data = JSON.parse(rawText) as { token?: unknown }
    if (typeof data.token === 'string') return data.token
  } catch (err) {
    // Firefox renders JSON responses through its JSON viewer, so the visible text is not raw JSON.
  }

  const quotedToken = rawText.match(/"token"\s*:\s*"([^"]+)"/)
  if (quotedToken?.[1]) return quotedToken[1]

  const jwtToken = rawText.match(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/)
  return jwtToken?.[0] ?? null
}

export const AdminLoginPage = ({ onLogin }: { onLogin: (token: string) => void }) => {
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const handleKakaoLogin = () => {
    setErrorMessage('')
    setIsLoggingIn(true)

    const popup = window.open(
      '/api/v1/auth/kakao',
      'allclear-kakao-login',
      'width=460,height=680,menubar=no,toolbar=no,location=no,status=no',
    )

    if (!popup) {
      setIsLoggingIn(false)
      setErrorMessage('팝업이 차단되었습니다. 브라우저에서 팝업을 허용해주세요.')
      return
    }

    const startedAt = Date.now()
    const timer = window.setInterval(() => {
      if (popup.closed) {
        window.clearInterval(timer)
        setIsLoggingIn(false)
        setErrorMessage('로그인 창이 닫혔습니다.')
        return
      }

      if (Date.now() - startedAt > 1000 * 60 * 2) {
        window.clearInterval(timer)
        popup.close()
        setIsLoggingIn(false)
        setErrorMessage('로그인 시간이 초과되었습니다. 다시 시도해주세요.')
        return
      }

      try {
        const rawText = [
          popup.document.body?.innerText,
          popup.document.body?.textContent,
          popup.document.documentElement?.textContent,
        ]
          .filter(Boolean)
          .join('\n')
          .trim()
        if (!rawText) return

        const token = extractTokenFromPopupText(rawText)
        if (!token) return

        window.clearInterval(timer)
        popup.close()
        setIsLoggingIn(false)
        onLogin(token)
      } catch (err) {
        // Kakao 도메인에 머무르는 동안에는 same-origin 접근이 막힌다.
      }
    }, 500)
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

          {errorMessage && (
            <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
              {errorMessage}
            </p>
          )}

          <p className="mt-5 text-xs leading-5 text-slate-500">
            기존 인증 API를 그대로 사용하며, 로그인 토큰은 이 브라우저의 로컬 저장소에 보관됩니다.
          </p>
        </section>
      </main>
    </>
  )
}
