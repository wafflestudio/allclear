import type { MouseEvent } from 'react'
import { MdiIcon } from '../icons'

type Props = {
  open: boolean
  setOpen: (open: boolean) => void
  value: string
  onSelect: (value: string) => void
  items: string[]
  placeholder: string
  disabled?: boolean
  /** 앱 style.paddingHorizontal (단과대 0, 학과 12) */
  paddingX?: number
  /** 앱 zIndex prop — 열린 드롭다운이 아래 요소 위로 오도록 */
  zIndex: number
  ariaLabel: string
}

/**
 * 앱 EditProfileScreen 의 react-native-dropdown-picker 설정을 그대로 옮긴 드롭다운:
 * 피커 minHeight 50, 테두리 없음, py 4, radius 12, 흰 배경 / 비활성 bg #EAEAEA
 * 텍스트 14/400 #202020, placeholder #C1C1C1, 화살표 keyboard-arrow-down/up 24 #C1C1C1
 * 목록: 피커 바로 아래(1px 겹침) 절대 배치, 흰 배경, radius 8, 패딩 4, 최대 높이 200,
 * 항목 높이 40 / px 10, 선택 항목엔 체크 표시.
 */
export function DropDownPicker({
  open,
  setOpen,
  value,
  onSelect,
  items,
  placeholder,
  disabled = false,
  paddingX = 0,
  zIndex,
  ariaLabel,
}: Props) {
  const handleToggle = (e: MouseEvent) => {
    // 폼 영역 탭(드롭다운 닫기)으로 전파되지 않게
    e.stopPropagation()
    if (disabled) return
    setOpen(!open)
  }

  return (
    <div className="relative w-full" style={{ zIndex }}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={handleToggle}
        className={`flex min-h-[50px] w-full items-center justify-between rounded-xl py-1 text-left ${
          disabled ? 'bg-[#EAEAEA]' : 'bg-white'
        }`}
        style={{ paddingLeft: paddingX, paddingRight: paddingX }}
      >
        <span
          className={`min-w-0 flex-1 truncate text-[14px] font-normal ${
            value ? 'text-[#202020]' : 'text-[#C1C1C1]'
          }`}
        >
          {value || placeholder}
        </span>
        <span className="ml-2.5 flex shrink-0 items-center justify-center">
          <MdiIcon name={open ? 'chevronUp' : 'chevronDown'} size={24} color="#C1C1C1" />
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className="absolute left-0 right-0 z-[1000] max-h-[200px] overflow-y-auto rounded-lg bg-white p-1"
          style={{ top: 'calc(100% - 1px)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((item) => {
            const isSelected = item === value
            return (
              <button
                key={item}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onSelect(item)
                  setOpen(false)
                }}
                className="flex h-10 w-full items-center justify-between px-2.5 text-left active:bg-[#F3F0F5]"
              >
                <span className="min-w-0 flex-1 truncate text-[14px] font-normal text-[#202020]">
                  {item}
                </span>
                {isSelected && (
                  <span className="ml-2.5 flex shrink-0 items-center">
                    <MdiIcon name="check" size={20} color="#202020" />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
