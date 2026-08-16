import { useState } from 'react'
import { BottomSheet } from '../../shared/components/BottomSheet'

type Props = {
  onClose: () => void
  /** 앱 UserVoiceView.handleSubmit — 시트를 닫은 뒤 전송/토스트는 호출부에서 처리 */
  onSubmit: (content: string) => void
}

/**
 * 앱 shared/components/UserVoiceView(+ userVoiceBottomSheetContext, 스냅 440)와 동일:
 * pt 24 / pb 16 / px 24, 가운데 정렬 타이틀 2줄(16/600·16/500, lh 24) 아래 24,
 * 입력창(높이 120, px 16, py 8, radius 12, 16/500/lh24, placeholder #757474, 1000자),
 * 맨 아래 고정 "의견 보내기" 버튼(bg #202020, padding 16, radius 12, 16/600 흰색).
 */
export function UserVoiceSheet({ onClose, onSubmit }: Props) {
  const [input, setInput] = useState('')

  const handleSubmit = () => {
    if (!input) return
    onSubmit(input)
  }

  return (
    <BottomSheet
      onClose={onClose}
      panelClassName="h-[440px] max-h-[calc(100dvh-16px)]"
      ariaLabel="개발자에게 요청하기"
    >
      <div className="flex min-h-0 flex-1 flex-col px-6 pb-4 pt-6">
        <div className="mb-6 flex items-center justify-center">
          <div>
            <p className="text-[16px] font-semibold leading-6 text-[#202020]">
              여러분의 의견이 필요해요!
            </p>
            <p className="text-[16px] font-medium leading-6 text-[#202020]">
              올클에 건의사항이 있다면 자유롭게 알려주세요😊
            </p>
          </div>
        </div>
        <div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={4}
            maxLength={1000}
            enterKeyHint="done"
            placeholder="여기에 의견을 적어주세요. (1000자 이내)"
            className="h-[120px] w-full resize-none rounded-xl bg-white px-4 py-2 text-[16px] font-medium leading-6 text-[#202020] outline-none placeholder:text-[#757474]"
          />
        </div>
        <div className="mt-auto w-full">
          <button
            type="button"
            disabled={!input}
            onClick={handleSubmit}
            className="w-full rounded-xl bg-[#202020] p-4 text-center text-[16px] font-semibold text-white active:opacity-80"
          >
            의견 보내기
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}
