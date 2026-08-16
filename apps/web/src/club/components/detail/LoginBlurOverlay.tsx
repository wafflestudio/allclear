import type { ClubTabLabel } from '../ClubDetailTabBar'

type Props = {
  clubName: string
  tabLabel: ClubTabLabel
  onLoginPress: () => void
}

/**
 * 앱 ClubDetail/LoginBlurOverlay.tsx 와 동일:
 * 비로그인 상태에서 카드 전체를 블러(8) + 흰색 60% 베일로 덮고, 위에서 40px 지점에 로그인 안내를 띄운다.
 * 부모 카드는 relative 여야 한다.
 */
export function LoginBlurOverlay({ clubName, tabLabel, onLoginPress }: Props) {
  return (
    <>
      <div
        className="absolute inset-0 z-[1] overflow-hidden rounded-2xl bg-[rgba(255,255,255,0.6)] backdrop-blur-[8px]"
        aria-hidden="true"
      />
      <div className="absolute inset-x-0 top-10 z-[2] flex flex-col items-center">
        <p className="mt-2 text-center text-[14px] font-normal text-[#757474]">
          <span className="font-semibold text-[#202020]">{clubName}</span>
          {`의 ${tabLabel}를 보려면`}
        </p>
        <p className="mt-2 text-center text-[14px] font-normal text-[#757474]">
          로그인이 필요해요!
        </p>
        <button
          type="button"
          onClick={onLoginPress}
          className="mt-3 px-2 py-1 text-[14px] font-semibold text-[#202020] underline active:opacity-40"
        >
          로그인 하러 가기
        </button>
      </div>
    </>
  )
}
