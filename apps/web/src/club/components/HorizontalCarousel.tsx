import { ReactNode, useEffect, useRef } from 'react'

type Props = {
  children: ReactNode
}

/**
 * 마우스 휠(세로 스크롤)을 가로 스크롤로 변환해 사용자가 직접 조작하는 캐러셀.
 * 끝에 닿으면 휠 이벤트를 소비하지 않아 페이지 스크롤로 자연스럽게 넘어간다.
 */
export function HorizontalCarousel({ children }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const onWheel = (e: WheelEvent) => {
      // 트랙패드 가로 스와이프는 브라우저 기본 동작에 맡긴다
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return

      const maxScroll = el.scrollWidth - el.clientWidth
      const canScroll = e.deltaY > 0 ? el.scrollLeft < maxScroll - 1 : el.scrollLeft > 0
      if (!canScroll) return

      e.preventDefault()
      el.scrollLeft += e.deltaY
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', onWheel)
    }
  }, [])

  return (
    <div ref={scrollRef} className="scrollbar-hide flex w-full gap-2.5 overflow-x-auto px-5 pb-0.5">
      {children}
    </div>
  )
}
