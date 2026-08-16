import { useEffect, useState } from 'react'
import { AppButton } from './AppButton'
import { Checkbox } from './Checkbox'
import { MdiIcon } from './icons'

type Props = {
  announcementUuid: string
  title: string
  description: string
  /** 앱: 로그인 상태에서만 "다시 보지 않기" 노출 */
  showHideOption: boolean
  onHide: () => void
  onClose: () => void
}

/**
 * 앱 shared/components/AnnouncementModal 과 동일:
 * 딤(0.2)+blur(탭하면 닫힘) → 카드(radius 28, px 24, pt 20, pb 24, 높이 min(500, 화면-40))
 * 배지 "공지" + 닫기(22) → 타이틀 25/700/lh30 (gap 18) → 본문 15/400/lh22 #757474 스크롤(위 16)
 * → 푸터(위 16, gap 40): "다시 보지 않기"(13/500/lh16 #874FFF) + "확인"(너비 188, radius 12)
 */
export function AnnouncementModal({
  announcementUuid,
  title,
  description,
  showHideOption,
  onHide,
  onClose,
}: Props) {
  const [hideChecked, setHideChecked] = useState(false)

  // 새 공지로 바뀌면 체크 상태 초기화
  useEffect(() => {
    setHideChecked(false)
  }, [announcementUuid])

  const handleDismiss = () => {
    if (showHideOption && hideChecked) {
      onHide()
      return
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-5 font-pretendard">
      <button
        type="button"
        aria-label="닫기"
        onClick={handleDismiss}
        className="absolute inset-0 cursor-default bg-black/20 backdrop-blur-[1px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="공지"
        className="relative flex w-full max-w-[440px] flex-col rounded-[28px] bg-white px-6 pb-6 pt-5"
        style={{ height: 'min(500px, calc(100dvh - 40px))' }}
      >
        <div className="flex flex-col gap-[18px]">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-[rgba(135,79,255,0.1)] px-2.5 py-1.5 text-[10px] font-semibold leading-[14px] text-[#874FFF]">
              공지
            </span>
            <button
              type="button"
              aria-label="닫기"
              onClick={handleDismiss}
              className="p-0.5 text-[#757474] active:opacity-50"
            >
              <MdiIcon name="close" size={22} />
            </button>
          </div>
          <p className="text-[25px] font-bold leading-[30px] text-[#202020]">{title}</p>
        </div>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
          <p className="whitespace-pre-line text-[15px] font-normal leading-[22px] text-[#757474]">
            {description}
          </p>
        </div>

        <div className="mt-4 flex flex-col gap-10">
          {showHideOption && (
            <Checkbox
              label="다시 보지 않기"
              checked={hideChecked}
              onToggle={() => setHideChecked((prev) => !prev)}
              className="self-start"
              labelClassName="text-[13px] font-medium leading-4 text-[#874FFF]"
            />
          )}
          <div className="flex items-center justify-center">
            <AppButton label="확인" onClick={handleDismiss} width={188} borderRadius={12} />
          </div>
        </div>
      </div>
    </div>
  )
}
