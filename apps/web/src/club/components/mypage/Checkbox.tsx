import { MdiIcon } from '../icons'

type Props = {
  label: string
  checked: boolean
  onToggle: () => void
  className?: string
  /** 앱 textStyle 대응 — 기본 라벨(12/600/lh14, #874FFF)을 덮어쓴다 */
  labelClassName?: string
}

// 앱 shared/components/Checkbox와 동일: MDI checkbox-marked/blank-outline 14 #874FFF + gap 4 + 라벨
export function Checkbox({ label, checked, onToggle, className = '', labelClassName }: Props) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className={`flex items-center gap-1 text-left active:opacity-70 ${className}`}
    >
      <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center">
        <MdiIcon name={checked ? 'checkboxMarked' : 'checkboxBlank'} size={14} color="#874FFF" />
      </span>
      <span className={labelClassName ?? 'text-[12px] font-semibold leading-[14px] text-[#874FFF]'}>
        {label}
      </span>
    </button>
  )
}
