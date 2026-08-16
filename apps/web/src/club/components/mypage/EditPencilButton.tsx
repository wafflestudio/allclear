type Props = {
  ariaLabel: string
  onClick: () => void
}

const PENCIL_MASK_STYLE = {
  WebkitMaskImage: 'url(/images/mypage/club-edit-pencil.png)',
  maskImage: 'url(/images/mypage/club-edit-pencil.png)',
  WebkitMaskSize: 'contain',
  maskSize: 'contain',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
  WebkitMaskPosition: 'center',
  maskPosition: 'center',
} as const

/**
 * 앱 shared/components/EditPencilButton 과 동일:
 * 28×28 원형, 기본 bg #EAEAEA + 아이콘(14×14 tint) #874FFF,
 * hover → bg #874FFF/아이콘 흰색, pressed → bg #4F2E94/아이콘 흰색, hitSlop 8.
 * 앱은 Image tintColor 로 색을 입히므로 웹은 PNG 를 마스크로 써서 같은 효과를 낸다.
 */
export function EditPencilButton({ ariaLabel, onClick }: Props) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className="group relative flex h-7 w-7 items-center justify-center rounded-full bg-[#EAEAEA] before:absolute before:-inset-2 before:content-[''] [@media(hover:hover)]:hover:bg-[#874FFF] active:bg-[#4F2E94]"
    >
      <span
        aria-hidden="true"
        className="block h-3.5 w-3.5 bg-[#874FFF] group-active:bg-white [@media(hover:hover)]:group-hover:bg-white"
        style={PENCIL_MASK_STYLE}
      />
    </button>
  )
}
