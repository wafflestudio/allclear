import React from 'react'
import AppStoreButtons from '../common/components/AppStoreButtons'

type Props = {
  onOpenApp: () => void
  hasAttemptedAppOpen: boolean
}

const ManagerTransferFallbackView = ({ onOpenApp, hasAttemptedAppOpen }: Props) => (
  <main className="flex min-h-screen items-center justify-center bg-gray-50 px-5 py-10">
    <section className="w-full max-w-md rounded-xl border border-gray-200 bg-white px-6 py-9 text-center sm:px-9">
      <img src="/images/logo.png" alt="올클" className="mx-auto h-auto w-28" />
      <h1 className="mt-7 text-2xl font-bold tracking-tight text-gray-900">
        관리자 권한 이전 요청
      </h1>
      <p className="mt-3 text-base leading-6 text-gray-600">
        올클 앱에서 링크를 열어
        <br />
        관리자 권한 이전을 계속해주세요.
      </p>

      <button
        type="button"
        onClick={onOpenApp}
        className="mt-7 min-h-12 w-full rounded-lg bg-primary-700 px-5 py-3 font-semibold text-white transition-colors hover:bg-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-200"
      >
        올클 앱에서 열기
      </button>

      <p role="status" className="mt-6 text-sm leading-5 text-gray-500">
        {hasAttemptedAppOpen
          ? '앱이 열리지 않으면 아래 스토어에서 설치 여부를 확인해주세요.'
          : '앱을 여는 중이에요.'}
      </p>
      <div className="mt-4">
        <AppStoreButtons />
      </div>
    </section>
  </main>
)

export default ManagerTransferFallbackView
