import { useRouter } from 'next/router'
import { RefObject, useEffect, useState } from 'react'
import { MdiIcon } from './icons'

export const DETAIL_HEADER_HEIGHT = 56

type Props = {
  title: string
  tabBarRef: RefObject<HTMLDivElement>
}

/**
 * 앱 ClubDetailScreen의 헤더 안무:
 * - 배경 #FAFAFA 판이 scrollY 0 → (탭바 offset − 56) 구간에서 opacity 0 → 1로 보간
 * - 탭바가 헤더 아래(56px)에 닿아 핀 되는 순간부터 동아리명 타이틀 표시
 */
export function ClubDetailHeader({ title, tabBarRef }: Props) {
  const router = useRouter()
  const [bgOpacity, setBgOpacity] = useState(0)
  const [isPinned, setIsPinned] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const el = tabBarRef.current
      if (!el) return
      const top = el.getBoundingClientRect().top
      // 핀 여부: 스티키 탭바 윗변이 헤더 하단(56)에 닿았는가
      setIsPinned(top <= DETAIL_HEADER_HEIGHT)
      // 임계 스크롤량 = 탭바의 문서상 y좌표 − 56 (핀 시 top==56이라 자동으로 1)
      const threshold = window.scrollY + top - DETAIL_HEADER_HEIGHT
      setBgOpacity(threshold > 0 ? Math.min(window.scrollY / threshold, 1) : 1)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [tabBarRef])

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/club')
    }
  }

  return (
    <div className="fixed inset-x-0 top-0 z-40">
      <div className="relative mx-auto flex h-14 max-w-[480px] items-center px-4">
        <div
          className="pointer-events-none absolute inset-0 bg-[#FAFAFA]"
          style={{ opacity: bgOpacity }}
        />
        <button
          type="button"
          onClick={handleBack}
          aria-label="뒤로 가기"
          className="relative z-10 flex h-full w-8 items-center text-[#757474] active:opacity-50"
        >
          <MdiIcon name="chevronLeft" size={28} />
        </button>
        {isPinned && (
          <p className="pointer-events-none absolute inset-x-12 inset-y-0 z-10 flex items-center justify-center">
            <span className="truncate text-[16px] font-semibold text-[#757474]">{title}</span>
          </p>
        )}
      </div>
    </div>
  )
}
