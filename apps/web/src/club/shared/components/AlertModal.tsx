import type { ReactNode } from 'react'
import { AppButton, type AppButtonVariant } from './AppButton'

type Props = {
  title: string
  /** 앱 titleContent — 있으면 title 대신 렌더 */
  titleContent?: ReactNode
  description?: ReactNode
  buttonLabel: string
  buttonVariant?: AppButtonVariant
  buttonDisabled?: boolean
  hasCancel?: boolean
  cancelLabel?: string
  /** 앱 dismissOnBackdropPress (기본 true): 딤 영역 탭 시 onCancel */
  dismissOnBackdropPress?: boolean
  /** 앱 overlayColor (기본 BACKGROUND_DIM_STRONG rgba(0,0,0,0.4)) */
  overlayColor?: string
  /** 웹 전용: 요청 중 확인 버튼 비활성 */
  isSubmitting?: boolean
  onConfirm: () => void
  /** 앱 onClose — 취소 버튼과 딤 영역 탭 모두 여기로 온다 */
  onCancel: () => void
}

/**
 * 앱 shared/components/AlertModal과 동일:
 * 딤(0.4) + blur 1 → 흰 카드(radius 16, padding 24, 좌우 여백 24)
 * 타이틀 18/700 검정 가운데, 설명 14/400 검정 가운데 (mt 12), 버튼 행 gap 8 (mt 24)
 * 취소 = outline, 확인 = primary/destructive, 버튼 px 16
 */
export function AlertModal({
  title,
  titleContent,
  description,
  buttonLabel,
  buttonVariant = 'primary',
  buttonDisabled = false,
  hasCancel = false,
  cancelLabel = '취소',
  dismissOnBackdropPress = true,
  overlayColor = 'rgba(0, 0, 0, 0.4)',
  isSubmitting = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[60] flex items-center justify-center px-6 font-pretendard backdrop-blur-[1px]"
      style={{ backgroundColor: overlayColor }}
      onClick={dismissOnBackdropPress ? onCancel : undefined}
    >
      <div
        className="w-full max-w-[432px] rounded-2xl bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="whitespace-pre-line text-center text-[18px] font-bold text-black">
          {titleContent ?? title}
        </p>
        {description ? (
          <p className="mt-3 whitespace-pre-line text-center text-[14px] font-normal text-black">
            {description}
          </p>
        ) : null}
        <div className="mt-6 flex gap-2">
          {hasCancel && (
            <AppButton label={cancelLabel} onClick={onCancel} variant="outline" paddingX={16} />
          )}
          <AppButton
            label={buttonLabel}
            onClick={onConfirm}
            variant={buttonVariant}
            disabled={buttonDisabled || isSubmitting}
            paddingX={16}
          />
        </div>
      </div>
    </div>
  )
}
