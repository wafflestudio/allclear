type Props = {
  label: string
  selected: boolean
  onToggle: () => void
  className?: string
}

// 앱 SearchFilterToggleGroupItem과 동일: radius 20, 위 7 / 아래 8 / 좌우 15 패딩, 테두리 1
// 선택: #874FFF 채움 + 흰 글씨 11/600 (테두리 투명), 비선택: 투명 배경 + #C1C1C1 테두리/글씨 11/500
// 배경색은 160ms 동안 전환, hitSlop 8
export function FilterChip({ label, selected, onToggle, className }: Props) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={`relative rounded-[20px] border pb-2 pt-[7px] text-[11px] leading-[14px] transition-colors duration-[160ms] before:absolute before:-inset-2 before:content-[''] ${
        selected
          ? 'border-transparent bg-[#874FFF] font-semibold text-white'
          : 'border-[#C1C1C1] bg-transparent font-medium text-[#C1C1C1]'
      } ${className ?? 'px-[15px]'}`}
    >
      {label}
    </button>
  )
}
