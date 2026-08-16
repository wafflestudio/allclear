import type { OfficialVerificationStatus } from '../../../../common/constants/official-verification-status'

// 앱 features/club/components/VerificationMark.tsx 와 동일

export const DEFAULT_VERIFICATION_MARK_SIZE = 20

const MARK_SOURCE_BY_STATUS: Partial<Record<OfficialVerificationStatus, string>> = {
  VERIFIED: '/icons/clubInfo/verification-mark.png',
  PENDING: '/icons/clubInfo/verification-pending-mark.png',
}

type Props = {
  status?: OfficialVerificationStatus | null
  size?: number
}

export function VerificationMark({ status, size = DEFAULT_VERIFICATION_MARK_SIZE }: Props) {
  const markSource = status ? MARK_SOURCE_BY_STATUS[status] : undefined

  if (!markSource) return null

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={markSource}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className="shrink-0 object-contain"
      style={{ width: size, height: size }}
    />
  )
}

type ButtonProps = {
  status?: OfficialVerificationStatus | null
  onPress: () => void
}

// 앱 ClubDetail/VerificationMarkButton.tsx: VERIFIED/PENDING 일 때만 20×20 버튼으로 노출
export function VerificationMarkButton({ status, onPress }: ButtonProps) {
  if (status !== 'VERIFIED' && status !== 'PENDING') return null

  return (
    <button
      type="button"
      aria-label="동아리 인증 상태 안내"
      onClick={onPress}
      className="flex shrink-0 items-center justify-center active:opacity-50"
      style={{ width: DEFAULT_VERIFICATION_MARK_SIZE, height: DEFAULT_VERIFICATION_MARK_SIZE }}
    >
      <VerificationMark status={status} />
    </button>
  )
}
