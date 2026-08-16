import { useState } from 'react'
import { BottomSheet } from '../components/mypage/BottomSheet'
import { Spinner } from '../components/mypage/Spinner'
import { startKakaoLogin } from './kakaoLogin'

type Props = {
  onClose: () => void
}

/**
 * 앱 shared/components/LoginView(+ loginBottomSheetContext)와 동일한 로그인 바텀시트.
 * - 세로 32 / 가로 24 패딩, 타이틀 "로그인"(16/600) + "이 필요해요"(16/400) 가운데, 아래 24
 * - 카카오 버튼: #FEE500, padding 16, radius 12, 아이콘 24 (top 13 / left 16), 라벨 14/500 검정
 * - 약관 링크 행: gap 8, 위 10, 12/400/lh18 #C1C1C1
 * 웹은 카카오만 — Apple 로그인은 iOS 네이티브 전용(Platform.OS === "ios")이라 제외.
 * 시트 높이는 앱 Android 스냅포인트(260)를 최소 높이로 둔다.
 */
export function LoginSheet({ onClose }: Props) {
  const [isLoading, setIsLoading] = useState(false)

  const handleKakaoPress = () => {
    if (isLoading) return
    setIsLoading(true)
    startKakaoLogin()
  }

  return (
    <BottomSheet onClose={onClose} panelClassName="min-h-[260px]" ariaLabel="로그인">
      <div className="flex flex-1 flex-col px-6 py-8">
        <div className="mb-6 flex items-center justify-center">
          <span className="text-[16px] font-semibold text-black">로그인</span>
          <span className="text-[16px] font-normal text-black">이 필요해요</span>
        </div>
        <div>
          <button
            type="button"
            onClick={handleKakaoPress}
            disabled={isLoading}
            className={`relative mb-3 flex w-full items-center justify-center rounded-xl bg-[#FEE500] p-4 ${
              isLoading ? 'opacity-60' : ''
            }`}
          >
            {isLoading ? (
              <Spinner color="#000000" />
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/icons/kakao.png"
                  alt=""
                  width={24}
                  height={24}
                  className="absolute left-4 top-[13px]"
                />
                <span className="block text-center text-[14px] font-medium leading-[17px] text-black">
                  카카오톡으로 계속하기
                </span>
              </>
            )}
          </button>
        </div>
        <div className="mt-2.5 flex items-center justify-center gap-2">
          <a
            href="/terms/terms-of-service"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="text-[12px] font-normal leading-[18px] text-[#C1C1C1] active:opacity-50"
          >
            서비스 이용약관
          </a>
          <span className="text-[12px] font-normal leading-[18px] text-[#C1C1C1]">|</span>
          <a
            href="/terms/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="text-[12px] font-normal leading-[18px] text-[#C1C1C1] active:opacity-50"
          >
            개인정보 처리방침
          </a>
        </div>
      </div>
    </BottomSheet>
  )
}
