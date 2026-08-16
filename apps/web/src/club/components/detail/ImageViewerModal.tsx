import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { MdiIcon } from '../icons'
import { clampImageIndex, getAdjacentImageIndex } from './imageViewer'
import { ZoomableImage } from './ZoomableImage'

type Props = {
  imageUrls: string[]
  initialIndex: number
  visible: boolean
  onClose: () => void
}

/**
 * 앱 shared/components/ImageViewerModal.tsx 와 동일:
 * 검은 전체화면, 상단 "n / N" 카운터 + 닫기(28), 가운데 확대 가능한 사진,
 * 사진이 2장 이상이면 하단에 이전/다음(48 원형, #202020) 버튼.
 */
export function ImageViewerModal({ imageUrls, initialIndex, visible, onClose }: Props) {
  const [currentIndex, setCurrentIndex] = useState(() =>
    clampImageIndex(initialIndex, imageUrls.length),
  )
  // RN Modal 의 animationType="fade" 대응: 마운트 직후 opacity 0 → 1
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    if (visible) setCurrentIndex(clampImageIndex(initialIndex, imageUrls.length))
  }, [imageUrls.length, initialIndex, visible])

  useEffect(() => {
    if (!visible) {
      setEntered(false)
      return
    }
    const frame = requestAnimationFrame(() => setEntered(true))
    // 전체화면 모달 동안 뒤 페이지 스크롤 잠금 + ESC 로 닫기 (앱의 onRequestClose)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      cancelAnimationFrame(frame)
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [visible, onClose])

  if (imageUrls.length === 0 || !visible || typeof document === 'undefined') return null

  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex < imageUrls.length - 1
  const move = (direction: -1 | 1) => {
    setCurrentIndex((index) => getAdjacentImageIndex(index, direction, imageUrls.length))
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="사진 보기"
      className={`fixed inset-0 z-[60] flex flex-col bg-black font-pretendard text-white transition-opacity duration-200 ${
        entered ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="flex min-h-14 items-center justify-between px-3 pt-[env(safe-area-inset-top)]">
        <div className="h-11 w-11" />
        <p className="text-[14px] font-medium text-white">
          {currentIndex + 1} / {imageUrls.length}
        </p>
        <button
          type="button"
          aria-label="사진 닫기"
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center active:opacity-60"
        >
          <MdiIcon name="close" size={28} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <ZoomableImage
          key={`${imageUrls[currentIndex]}-${currentIndex}`}
          url={imageUrls[currentIndex]}
          alt={`${imageUrls.length}장 중 ${currentIndex + 1}번째 사진`}
        />
      </div>

      {imageUrls.length > 1 && (
        <div className="flex min-h-16 items-center justify-center gap-8 px-4 pb-[env(safe-area-inset-bottom)]">
          <button
            type="button"
            aria-label="이전 사진"
            disabled={!hasPrevious}
            onClick={() => move(-1)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#202020] active:opacity-60 disabled:opacity-30"
          >
            <MdiIcon name="chevronLeft" size={32} />
          </button>
          <button
            type="button"
            aria-label="다음 사진"
            disabled={!hasNext}
            onClick={() => move(1)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#202020] active:opacity-60 disabled:opacity-30"
          >
            <MdiIcon name="chevronRight" size={32} />
          </button>
        </div>
      )}
    </div>,
    document.body,
  )
}
