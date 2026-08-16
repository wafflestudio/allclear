import { MdiIcon } from '../../shared/components/icons'

type Props = {
  correctedQuery: string
  onClose?: () => void
}

// 앱 TypoCorrectionNotice와 동일: 좌우 17 / 위아래 13, radius 10, 배경 rgba(243,240,245,0.5),
// 흰 원(34) 안 auto-fix 18 #874FFF + 안내 2줄(12/500 lh17 #757474, 교정어는 #874FFF) + 닫기(16 원, #C1C1C1, close 12 흰색, hitSlop 8)
export function TypoCorrectionNotice({ correctedQuery, onClose }: Props) {
  return (
    <div className="flex w-full items-center justify-between rounded-[10px] bg-[rgba(243,240,245,0.5)] px-[17px] py-[13px]">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-white text-[#874FFF]">
          <MdiIcon name="autoFix" size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-[12px] font-medium leading-[17px] text-[#757474]">
            올클이 오타를 감지했어요!
          </p>
          <p className="text-[12px] font-medium leading-[17px] text-[#757474]">
            유사 검색어 &lsquo;<span className="text-[#874FFF]">{correctedQuery}</span>&rsquo;로
            검색한 결과예요
          </p>
        </div>
      </div>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="안내 닫기"
          className="-m-2 ml-1 shrink-0 p-2"
        >
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#C1C1C1] text-white">
            <MdiIcon name="close" size={12} />
          </span>
        </button>
      ) : null}
    </div>
  )
}
