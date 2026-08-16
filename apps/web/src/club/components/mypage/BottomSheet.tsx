import { type ReactNode, useEffect, useState } from 'react'

type Props = {
  onClose: () => void
  children: ReactNode
  /** @gorhom/bottom-sheet 기본 핸들(상단 회색 바) 표시 여부 */
  showHandle?: boolean
  /** 시트 상단 모서리 radius (gorhom 기본 15) */
  radius?: number
  /** 시트 패널(흰 영역)에 추가할 클래스 — 높이 등 */
  panelClassName?: string
  ariaLabel?: string
}

/**
 * 앱 @gorhom/bottom-sheet(BottomSheetModal)의 웹 대응.
 * - 백드롭: BottomSheetBackdrop 기본값(검정 0.5), 탭하면 닫힘 (pressBehavior="close")
 * - 패널: 흰 배경, 상단 radius 15, 기본 핸들(패딩 10, 바 30×4 radius 4, rgba(0,0,0,0.75))
 * - 드래그로 닫는 제스처 대신 백드롭 탭으로 닫는다.
 */
export function BottomSheet({
  onClose,
  children,
  showHandle = true,
  radius = 15,
  panelClassName = '',
  ariaLabel,
}: Props) {
  // 앱처럼 아래에서 올라오는 표시 애니메이션
  const [isPresented, setIsPresented] = useState(false)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsPresented(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div className="fixed inset-0 z-50 font-pretendard">
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black transition-opacity duration-300"
        style={{ opacity: isPresented ? 0.5 : 0 }}
      />
      <div
        className="absolute inset-x-0 bottom-0 transition-transform duration-300 ease-out"
        style={{ transform: isPresented ? 'translateY(0)' : 'translateY(100%)' }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          className={`mx-auto flex w-full max-w-[480px] flex-col overflow-hidden bg-white pb-[env(safe-area-inset-bottom)] ${panelClassName}`}
          style={{ borderTopLeftRadius: radius, borderTopRightRadius: radius }}
        >
          {showHandle && (
            <div className="shrink-0 p-2.5">
              <div className="mx-auto h-1 w-[30px] rounded bg-black/75" />
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  )
}
