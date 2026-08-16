import { MdiIcon } from './icons'

type Props = {
  title: string
  onBack: () => void
  // 앱 BackHeader showBackButton: 저장한 동아리 화면처럼 뒤로가기 없이 타이틀만 보여줄 때 false
  showBackButton?: boolean
}

// 앱 BackHeader와 동일: 높이 56, 좌우 16, 뒤로가기(왼쪽 16, 폭 32, chevron-left 28 #757474),
// 가운데 타이틀 16/600 #757474 한 줄
export function BackHeader({ title, onBack, showBackButton = true }: Props) {
  return (
    <div className="relative flex h-14 w-full shrink-0 items-center px-4">
      {showBackButton && (
        <button
          type="button"
          onClick={onBack}
          aria-label="뒤로 가기"
          className="absolute inset-y-0 left-4 z-10 flex w-8 items-center justify-center text-[#757474]"
        >
          <MdiIcon name="chevronLeft" size={28} />
        </button>
      )}
      <p className="pointer-events-none absolute inset-0 flex items-center justify-center px-12">
        <span className="truncate text-[16px] font-semibold leading-[19px] text-[#757474]">
          {title}
        </span>
      </p>
    </div>
  )
}
