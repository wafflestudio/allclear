import { ReactNode } from 'react'

type Props = {
  title: string
  description: ReactNode
  buttonLabel: string
  buttonVariant?: 'primary' | 'destructive'
  hasCancel?: boolean
  isSubmitting?: boolean
  onConfirm: () => void
  onCancel: () => void
}

// 앱 AlertModal과 동일: 딤 + 흰 카드(radius 16, p 24), 타이틀 18/700, 버튼 행
export function AlertModal({
  title,
  description,
  buttonLabel,
  buttonVariant = 'primary',
  hasCancel = false,
  isSubmitting = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-6 backdrop-blur-[1px]">
      <div className="w-full max-w-[400px] rounded-2xl bg-white p-6">
        <p className="text-center text-[18px] font-bold text-black">{title}</p>
        <p className="mt-3 text-center text-[14px] font-normal text-black">{description}</p>
        <div className="mt-6 flex gap-2">
          {hasCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-lg border border-[#874FFF] px-4 py-3.5 text-[16px] font-semibold leading-5 text-[#874FFF] active:opacity-70"
            >
              취소
            </button>
          )}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
            className={`flex-1 rounded-lg px-4 py-3.5 text-[16px] font-semibold leading-5 text-white disabled:opacity-60 ${
              buttonVariant === 'destructive'
                ? 'bg-[#E53935] active:opacity-80'
                : 'bg-[#874FFF] active:bg-[#4F2E94]'
            }`}
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
