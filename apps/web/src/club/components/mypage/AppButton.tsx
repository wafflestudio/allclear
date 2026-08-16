export type AppButtonVariant = 'primary' | 'outline' | 'destructive'

type Props = {
  label: string
  onClick: () => void
  variant?: AppButtonVariant
  disabled?: boolean
  /** 앱 Button width prop — 없으면 flex: 1 */
  width?: number
  height?: number
  /** 앱 base paddingHorizontal 50 (AlertModal은 16으로 덮어씀) */
  paddingX?: number
  /** 앱 base borderRadius 8 (약관 모달 16, 공지 모달 12) */
  borderRadius?: number
  className?: string
}

const VARIANT_CLASS: Record<AppButtonVariant, string> = {
  primary: 'bg-[#874FFF] text-white active:bg-[#4F2E94]',
  outline:
    'border border-[#874FFF] bg-transparent text-[#874FFF] active:border-[#4F2E94] active:text-[#4F2E94]',
  destructive: 'bg-[#E53935] text-white active:opacity-80',
}

const DISABLED_CLASS: Record<AppButtonVariant, string> = {
  primary: 'bg-[#EAEAEA] text-[#C1C1C1]',
  outline: 'border border-[#C1C1C1] bg-transparent text-[#C1C1C1]',
  destructive: 'bg-[#EAEAEA] text-[#C1C1C1]',
}

/**
 * 앱 shared/components/Button과 동일:
 * radius 8, px 50, py 14, 라벨 16/600/lh20,
 * primary #874FFF(눌림 #4F2E94) / outline #874FFF 테두리 / destructive #E53935(눌림 opacity .8),
 * disabled → primaryDisabled(#EAEAEA/#C1C1C1) 또는 outlineDisabled(#C1C1C1 테두리)
 */
export function AppButton({
  label,
  onClick,
  variant = 'primary',
  disabled = false,
  width,
  height,
  paddingX = 50,
  borderRadius = 8,
  className = '',
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center py-3.5 text-[16px] font-semibold leading-5 ${
        disabled ? DISABLED_CLASS[variant] : VARIANT_CLASS[variant]
      } ${width === undefined ? 'flex-1' : 'shrink-0'} ${className}`}
      style={{
        width,
        height,
        paddingLeft: paddingX,
        paddingRight: paddingX,
        borderRadius,
      }}
    >
      {label}
    </button>
  )
}
