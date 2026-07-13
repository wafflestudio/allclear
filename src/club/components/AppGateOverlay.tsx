import { openClubInApp } from '../openInApp'

type Props = {
  clubName: string
  tabLabel: string // '모집공고' | '활동후기'
  uuid: string
}

/**
 * 앱의 LoginBlurOverlay에 대응하는 웹 오버레이.
 * 앱에서는 로그인으로, 웹에서는 앱 설치/로그인으로 유도한다.
 */
export function AppGateOverlay({ clubName, tabLabel, uuid }: Props) {
  return (
    <div className="absolute inset-0 z-10 overflow-hidden rounded-2xl">
      <div className="absolute inset-0 bg-white/60 backdrop-blur-[8px]" />
      <div className="absolute inset-x-0 top-10 flex flex-col items-center">
        <p className="mt-2 text-center text-[14px] font-normal text-[#757474]">
          <span className="font-semibold text-[#202020]">{clubName}</span>의 {tabLabel}를 보려면
        </p>
        <p className="mt-2 text-center text-[14px] font-normal text-[#757474]">
          앱에서 로그인이 필요해요!
        </p>
        <button
          type="button"
          onClick={() => openClubInApp(uuid)}
          className="mt-3 px-2 py-1 text-[14px] font-semibold text-[#202020] underline active:opacity-40"
        >
          올클리어 앱에서 보기
        </button>
      </div>
    </div>
  )
}
