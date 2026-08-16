import { useRouter } from 'next/router'
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react'
import * as GA from '../../common/connectors/ga'
import LocalStorage from '../../common/storage/storage'
import { APP_BANNER_DISMISSED_STORAGE_KEY } from '../../common/storage/storage-key'
import { detectMobilePlatform, isAppBannerPath, type MobilePlatform, toPathname } from '../appLink'
import { openCurrentPageInApp } from '../openInApp'
import { MdiIcon } from './icons'

export const APP_BANNER_HEIGHT = 64

/** 배너를 닫으면 일주일 동안 다시 띄우지 않는다 */
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000

const AppBannerHeightContext = createContext(0)

/**
 * 현재 배너가 차지하고 있는 높이(px). 배너가 없으면 0.
 * 화면 상단에 고정(fixed/sticky)되는 요소를 그만큼 아래로 내릴 때 쓴다.
 * CSS만으로 계산해야 하는 곳에서는 --app-banner-h 변수를 쓴다.
 */
export const useAppBannerHeight = () => useContext(AppBannerHeightContext)

/**
 * 모바일 웹으로 접속한 사용자에게 앱으로 이어서 보도록 유도하는 상단 배너.
 * 배너를 누르면 앱이 있으면 앱의 같은 화면으로, 없으면 설치 페이지로 이동한다.
 */
export function AppBannerProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [platform, setPlatform] = useState<MobilePlatform | null>(null)
  const [isDismissed, setIsDismissed] = useState(true)

  // UA와 스토리지는 브라우저에서만 알 수 있어 첫 렌더 이후에 판단한다
  useEffect(() => {
    // 앱 웹뷰로 열린 페이지(약관 등)에서는 앱을 다시 권할 이유가 없다
    if (window.ReactNativeWebView) {
      return
    }
    setPlatform(detectMobilePlatform(navigator.userAgent))
    setIsDismissed(Boolean(LocalStorage.getWithExpiry(APP_BANNER_DISMISSED_STORAGE_KEY)))
  }, [])

  const isVisible = platform !== null && !isDismissed && isAppBannerPath(toPathname(router.asPath))

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--app-banner-h', isVisible ? `${APP_BANNER_HEIGHT}px` : '0px')
    return () => {
      root.style.removeProperty('--app-banner-h')
    }
  }, [isVisible])

  const handleOpen = () => {
    GA.setEvent({ category: 'AppBanner', action: 'open', label: platform ?? '' })
    openCurrentPageInApp(router.asPath)
  }

  const handleDismiss = () => {
    GA.setEvent({ category: 'AppBanner', action: 'dismiss', label: platform ?? '' })
    LocalStorage.setWithExpiry(APP_BANNER_DISMISSED_STORAGE_KEY, 'true', DISMISS_DURATION_MS)
    setIsDismissed(true)
  }

  return (
    <AppBannerHeightContext.Provider value={isVisible ? APP_BANNER_HEIGHT : 0}>
      {isVisible && <AppInstallBanner onOpen={handleOpen} onDismiss={handleDismiss} />}
      {children}
    </AppBannerHeightContext.Provider>
  )
}

type Props = {
  onOpen: () => void
  onDismiss: () => void
}

function AppInstallBanner({ onOpen, onDismiss }: Props) {
  return (
    <div className="sticky top-0 z-50 w-full bg-white shadow-[0_1px_6px_rgba(0,0,0,0.1)]">
      <div
        className="mx-auto flex max-w-[480px] items-center pl-1 pr-3 font-pretendard"
        style={{ height: APP_BANNER_HEIGHT }}
      >
        <button
          type="button"
          onClick={onDismiss}
          aria-label="앱 설치 배너 닫기"
          className="shrink-0 p-2.5 text-[#C1C1C1] active:opacity-50"
        >
          <MdiIcon name="close" size={18} />
        </button>
        <button
          type="button"
          onClick={onOpen}
          className="flex min-w-0 flex-1 items-center gap-3 py-2 text-left active:opacity-60"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/apple-touch-icon.png"
            alt=""
            width={40}
            height={40}
            className="shrink-0 rounded-[10px] border border-[#EFEFEF] object-contain"
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-semibold text-[#202020]">
              올클리어 앱으로 보기
            </span>
            <span className="block truncate text-[12px] font-normal text-[#757474]">
              앱에서 더 편하게 동아리를 찾아보세요
            </span>
          </span>
          <span className="ml-1 shrink-0 rounded-lg bg-[#874FFF] px-3.5 py-2 text-[13px] font-semibold text-white">
            열기
          </span>
        </button>
      </div>
    </div>
  )
}
