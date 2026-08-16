type Props = {
  message: string
  onClose: () => void
}

/**
 * 앱 MyPageScreen RequestRemovalSuccessModal 과 동일:
 * 딤(0.2)+blur, 탭하면 닫힘 → 카드(너비 320, radius 12, padding 24, gap 24)
 * 메시지 16/700/lh24 검정 가운데 → "확인"(높이 44, bg #874FFF, radius 8, 16/600/lh20 흰색)
 */
export function RequestRemovalSuccessModal({ message, onClose }: Props) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 font-pretendard backdrop-blur-[1px]"
      onClick={onClose}
    >
      <div
        className="flex w-[320px] max-w-[calc(100%-32px)] flex-col items-center gap-6 rounded-xl bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex w-full flex-col items-center gap-2">
          <p className="w-full text-center font-['Apple_SD_Gothic_Neo',Pretendard,sans-serif] text-[16px] font-bold leading-6 text-black">
            {message}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-full items-center justify-center rounded-lg bg-[#874FFF] font-['Apple_SD_Gothic_Neo',Pretendard,sans-serif] text-[16px] font-semibold leading-5 text-white active:opacity-60"
        >
          확인
        </button>
      </div>
    </div>
  )
}
