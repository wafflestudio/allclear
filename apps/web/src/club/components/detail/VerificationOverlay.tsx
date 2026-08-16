import type { CSSProperties } from 'react'
import type { OfficialVerificationStatus } from '../../../common/constants/official-verification-status'

type Props = {
  status?: OfficialVerificationStatus | null
  visible: boolean
  className?: string
  style?: CSSProperties
}

/**
 * 앱 ClubDetail/VerificationOverlay.tsx 와 동일:
 * 인증 마크를 누르면 300ms 페이드로 나타나는 안내 말풍선 (#F3F0F5, radius 10, 15/10 패딩).
 * 앱은 히어로 카드 안에서 absolute(right 0) + translateY(-(높이+8)) 로 카드 위에 띄운다.
 */
export function VerificationOverlay({ status, visible, className, style }: Props) {
  if (!status || status === 'UNVERIFIED') return null

  return (
    <div
      aria-hidden={!visible}
      className={`z-10 rounded-[10px] bg-[#F3F0F5] px-[15px] py-2.5 transition-opacity duration-300 ease-in-out ${
        visible ? 'opacity-100' : 'pointer-events-none opacity-0'
      } ${className ?? ''}`}
      style={style}
    >
      {status === 'VERIFIED' ? (
        <p className="whitespace-nowrap text-center text-[12px] font-medium text-[#757474]">
          {'올클 '}
          <span className="text-[#874FFF]">공식인증이 완료</span>
          {'된 동아리에요!'}
        </p>
      ) : (
        <p className="whitespace-nowrap text-center text-[12px] font-medium text-[#757474]">
          {'아직 올클 '}
          <span className="text-[#874FFF]">공식인증 심사중</span>
          {'인 동아리에요.'}
        </p>
      )}
    </div>
  )
}
