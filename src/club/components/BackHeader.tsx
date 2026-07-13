import { MdiIcon } from './icons'

type Props = {
  title: string
  onBack: () => void
}

// 앱 BackHeader와 동일: 높이 56, chevron-left 28 #757474, 중앙 타이틀 16/600/#757474
export function BackHeader({ title, onBack }: Props) {
  return (
    <div className="relative flex h-14 w-full items-center px-4">
      <button
        type="button"
        onClick={onBack}
        aria-label="뒤로 가기"
        className="absolute inset-y-0 left-4 z-10 flex w-8 items-center justify-center text-[#757474] active:opacity-50"
      >
        <MdiIcon name="chevronLeft" size={28} />
      </button>
      <p className="pointer-events-none absolute inset-0 flex items-center justify-center px-12">
        <span className="truncate text-[16px] font-semibold text-[#757474]">{title}</span>
      </p>
    </div>
  )
}
