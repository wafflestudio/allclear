import { useCallback, useEffect, useRef } from 'react'
import type { Club } from '../../api/clubs'
import { getClubSummary } from '../../shared/utils/club'
import { ClubPreviewCard } from './ClubPreviewCard'

export const HORIZONTAL_CAROUSEL_BOTTOM_PADDING = 2

// 앱 useAutoScroll: 매 프레임 0.5px씩 흐르는 연속 자동 스크롤(마퀴). 끝에 닿으면 멈춘다.
const AUTO_SCROLL_STEP = 0.5

/**
 * 앱 shared/hooks/useAutoScroll 미러.
 * - 프레임마다 offset을 0.5px 늘려 scrollLeft에 반영한다 (항목이 1개 이하면 동작 안 함)
 * - 터치/드래그/관성 스크롤 중에는 멈추고, 끝나면 잠시 뒤 이어서 흐른다
 * - 사용자가 옮긴 위치(scroll 이벤트)를 offset에 반영해 그 자리부터 이어간다
 * - 화면에 (다시) 진입하면 처음부터 다시 흐른다
 */
function useAutoScroll(itemCount: number) {
  const listRef = useRef<HTMLDivElement>(null)
  const offsetRef = useRef(0)
  const isInteractingRef = useRef(false)
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // 우리가 마지막으로 적용한 scrollLeft. scroll 이벤트가 사용자 조작인지 구분하는 데 쓴다
  const lastProgrammaticLeftRef = useRef(0)

  const clearResumeTimeout = () => {
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current)
      resumeTimeoutRef.current = null
    }
  }

  const pauseAutoScroll = useCallback(() => {
    clearResumeTimeout()
    isInteractingRef.current = true
  }, [])

  const resumeAutoScroll = useCallback((delayMs = 0) => {
    clearResumeTimeout()

    if (delayMs > 0) {
      resumeTimeoutRef.current = setTimeout(() => {
        resumeTimeoutRef.current = null
        resumeAutoScroll()
      }, delayMs)
      return
    }

    isInteractingRef.current = false
  }, [])

  // 화면 진입 시 처음부터 다시 흐르도록 초기화 (앱 useFocusEffect)
  useEffect(() => {
    offsetRef.current = 0
    isInteractingRef.current = false
    lastProgrammaticLeftRef.current = 0
    const el = listRef.current
    if (el) el.scrollLeft = 0
    return () => clearResumeTimeout()
  }, [])

  // 프레임 콜백 (앱 useFrameCallback)
  useEffect(() => {
    let frame = 0
    const tick = () => {
      frame = requestAnimationFrame(tick)
      const el = listRef.current
      if (!el || itemCount <= 1 || isInteractingRef.current) return

      const maxOffset = el.scrollWidth - el.clientWidth
      if (maxOffset <= 0) return
      if (offsetRef.current >= maxOffset) return

      offsetRef.current = Math.min(offsetRef.current + AUTO_SCROLL_STEP, maxOffset)
      el.scrollLeft = offsetRef.current
      lastProgrammaticLeftRef.current = el.scrollLeft
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [itemCount])

  // 사용자 스크롤(드래그/관성/휠)이면 멈췄다가 끝나고 450ms 뒤 이어서 흐른다
  // (앱 onMomentumScrollBegin/End)
  const handleScroll = () => {
    const el = listRef.current
    if (!el) return
    if (Math.abs(el.scrollLeft - lastProgrammaticLeftRef.current) < 1) return
    offsetRef.current = el.scrollLeft
    lastProgrammaticLeftRef.current = el.scrollLeft
    pauseAutoScroll()
    resumeAutoScroll(450)
  }

  return {
    listRef,
    onScroll: handleScroll,
    onTouchStart: pauseAutoScroll,
    onTouchEnd: () => resumeAutoScroll(300),
    onTouchCancel: () => resumeAutoScroll(300),
    pauseAutoScroll,
    resumeAutoScroll,
  }
}

type Props = {
  clubs: Club[]
}

/**
 * 앱 HorizontalCarousel과 동일: 미리보기 카드 가로 목록(px 20, 카드 간격 10, 아래 여백 2) + 자동 스크롤.
 * 웹 전용 보조: 마우스 휠(세로)을 가로 스크롤로 바꿔주고, 끝에 닿으면 페이지 스크롤로 넘긴다.
 */
export function HorizontalCarousel({ clubs }: Props) {
  const { listRef, ...scrollEventProps } = useAutoScroll(clubs.length)

  useEffect(() => {
    const el = listRef.current
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
  }, [listRef])

  return (
    <div
      ref={listRef}
      {...scrollEventProps}
      // 세로 overflow까지 잘리지 않도록 카드 그림자만큼 안쪽 여백을 주고 음수 마진으로 상쇄한다
      // (레이아웃상 높이는 앱과 같이 카드 높이 + 아래 여백 2)
      className="scrollbar-hide -mb-2 -mt-2 flex w-full gap-2.5 overflow-x-auto px-5 pb-[10px] pt-2"
    >
      {clubs.map((club) => (
        <ClubPreviewCard
          key={club.id}
          href={`/club/${club.uuid}`}
          title={club.name}
          description={getClubSummary(club)}
          imageUri={club.imageUri}
        />
      ))}
    </div>
  )
}
