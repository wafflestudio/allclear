import { type PointerEvent as ReactPointerEvent, useCallback, useRef, useState } from 'react'
import { clampImageScale, getPanTranslation } from '../../../shared/utils/imageViewer'

type Props = {
  url: string
  alt: string
}

const DOUBLE_TAP_SCALE = 2
const DOUBLE_TAP_INTERVAL_MS = 300
const TAP_MOVE_TOLERANCE_PX = 10

type Transform = { scale: number; x: number; y: number }

const IDENTITY: Transform = { scale: 1, x: 0, y: 0 }

/**
 * 앱 shared/components/ZoomableImage.tsx 의 웹 이식:
 * - 두 손가락 핀치로 1~6배 확대/축소 (1배 이하로 놓으면 원위치)
 * - 확대 상태에서 한 손가락 드래그로 이동 (뷰포트 밖으로 못 나가게 클램프)
 * - 더블탭(더블클릭)으로 2배 확대 ↔ 원위치
 * 앱의 reanimated 워클릿 대신 Pointer Events 로 같은 제스처를 처리한다.
 */
export function ZoomableImage({ url, alt }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState<Transform>(IDENTITY)
  const [animated, setAnimated] = useState(false)

  // 제스처 중 매 프레임 갱신되는 값은 ref 에 두고, 렌더링용 state 는 그 사본이다.
  const current = useRef<Transform>(IDENTITY)
  const saved = useRef<Transform>(IDENTITY)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinchStart = useRef<{ distance: number; scale: number } | null>(null)
  const panStart = useRef<{ x: number; y: number; translation: { x: number; y: number } } | null>(
    null,
  )
  const tapCandidate = useRef<{ x: number; y: number; time: number } | null>(null)
  const lastTapTime = useRef(0)

  const viewport = () => {
    const el = containerRef.current
    return { width: el?.clientWidth ?? 0, height: el?.clientHeight ?? 0 }
  }

  const apply = useCallback((next: Transform, withAnimation: boolean) => {
    current.current = next
    setAnimated(withAnimation)
    setTransform(next)
  }, [])

  const resetZoom = useCallback(() => {
    saved.current = IDENTITY
    apply(IDENTITY, true)
  }, [apply])

  const distanceBetween = () => {
    const [a, b] = Array.from(pointers.current.values())
    if (!a || !b) return 0
    return Math.hypot(a.x - b.x, a.y - b.y)
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

    if (pointers.current.size === 2) {
      pinchStart.current = { distance: distanceBetween(), scale: saved.current.scale }
      panStart.current = null
      tapCandidate.current = null
      return
    }

    if (pointers.current.size === 1) {
      panStart.current = {
        x: event.clientX,
        y: event.clientY,
        translation: { x: saved.current.x, y: saved.current.y },
      }
      tapCandidate.current = { x: event.clientX, y: event.clientY, time: Date.now() }
    }
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

    if (pointers.current.size >= 2 && pinchStart.current) {
      const distance = distanceBetween()
      if (pinchStart.current.distance <= 0) return
      const scale = clampImageScale(
        pinchStart.current.scale * (distance / pinchStart.current.distance),
      )
      apply({ ...current.current, scale }, false)
      return
    }

    if (pointers.current.size === 1 && panStart.current) {
      const dx = event.clientX - panStart.current.x
      const dy = event.clientY - panStart.current.y
      if (tapCandidate.current && Math.hypot(dx, dy) > TAP_MOVE_TOLERANCE_PX) {
        tapCandidate.current = null
      }
      if (current.current.scale <= 1) return

      const next = getPanTranslation({
        initialTranslation: panStart.current.translation,
        gestureTranslation: { x: dx, y: dy },
        scale: current.current.scale,
        viewport: viewport(),
      })
      apply({ ...current.current, x: next.x, y: next.y }, false)
    }
  }

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return
    const wasPinching = pointers.current.size >= 2 && pinchStart.current !== null
    pointers.current.delete(event.pointerId)

    if (wasPinching) {
      pinchStart.current = null
      const scale = current.current.scale
      saved.current = { ...saved.current, scale }
      if (scale <= 1) {
        resetZoom()
      } else {
        const clamped = getPanTranslation({
          initialTranslation: { x: current.current.x, y: current.current.y },
          gestureTranslation: { x: 0, y: 0 },
          scale,
          viewport: viewport(),
        })
        saved.current = { scale, x: clamped.x, y: clamped.y }
        apply({ scale, x: clamped.x, y: clamped.y }, true)
      }
      // 남은 손가락으로 이어서 드래그할 수 있게 팬 기준점을 다시 잡는다
      const remaining = Array.from(pointers.current.values())[0]
      panStart.current = remaining
        ? {
            x: remaining.x,
            y: remaining.y,
            translation: { x: saved.current.x, y: saved.current.y },
          }
        : null
      return
    }

    // 팬 종료
    if (panStart.current) {
      if (saved.current.scale <= 1) {
        saved.current = { ...saved.current, x: 0, y: 0 }
      } else {
        saved.current = { ...saved.current, x: current.current.x, y: current.current.y }
      }
      panStart.current = null
    }

    // 더블탭 판정
    const tap = tapCandidate.current
    tapCandidate.current = null
    if (tap && Math.hypot(event.clientX - tap.x, event.clientY - tap.y) <= TAP_MOVE_TOLERANCE_PX) {
      const now = Date.now()
      if (now - lastTapTime.current < DOUBLE_TAP_INTERVAL_MS) {
        lastTapTime.current = 0
        if (current.current.scale > 1) {
          resetZoom()
        } else {
          saved.current = { scale: DOUBLE_TAP_SCALE, x: 0, y: 0 }
          apply({ scale: DOUBLE_TAP_SCALE, x: 0, y: 0 }, true)
        }
      } else {
        lastTapTime.current = now
      }
    }
  }

  return (
    <div
      ref={containerRef}
      className="h-full w-full touch-none select-none"
      style={{
        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        transition: animated ? 'transform 200ms ease-out' : 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={alt}
        draggable={false}
        className="pointer-events-none h-full w-full object-contain"
      />
    </div>
  )
}
