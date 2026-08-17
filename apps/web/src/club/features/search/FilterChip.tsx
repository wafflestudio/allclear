type Props = {
  label: string
  selected: boolean
  onToggle: () => void
  className?: string
}

// 앱 SearchFilterToggleGroupItem과 동일: radius 20, 선택 시 #874FFF 채움/흰 글씨
export function FilterChip({ label, selected, onToggle, className }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`rounded-[20px] border pb-2 pt-[7px] text-[11px] leading-[14px] transition-colors duration-150 ${
        selected
          ? 'border-transparent bg-[#874FFF] font-semibold text-white'
          : 'border-[#C1C1C1] bg-transparent font-medium text-[#C1C1C1]'
      } ${className ?? 'px-[15px]'}`}
    >
      {label}
    </button>
  )
}
