import type { ReactNode } from 'react'

/**
 * 앱 InfoTab(StatePills)/RecruitmentDetailCard(BooleanPills, DetailTag) 공통 알약 UI.
 * - Pill: 높이 30, 좌우 15, 테두리 0.65 #CBCBCB, radius 20 / 선택 시 POINTCOLOR 채움
 *   텍스트: 12/500 #CBCBCB(lh17, ls -0.24) → 선택 시 12/600 흰색(lh14)
 * - DetailTag: 좌우 15 상하 8, 테두리 1 POINTCOLOR, radius 10, POINTCOLOR 10% 배경, 12/600/14 #757474
 */

type PillProps = {
  label: ReactNode
  selected: boolean
  /** 앱 InfoTab 은 선택 시에도 letterSpacing(-0.24) 을 유지하고, RecruitmentDetailCard 는 0 으로 되돌린다 */
  keepTrackingWhenSelected?: boolean
}

export function Pill({ label, selected, keepTrackingWhenSelected = false }: PillProps) {
  return (
    <span
      className={`flex h-[30px] items-center justify-center rounded-[20px] border-[0.65px] px-[15px] ${
        selected ? 'border-[#874FFF] bg-[#874FFF]' : 'border-[#CBCBCB]'
      }`}
    >
      <span
        className={
          selected
            ? `text-[12px] font-semibold leading-[14px] text-white ${
                keepTrackingWhenSelected ? 'tracking-[-0.24px]' : 'tracking-normal'
              }`
            : 'text-[12px] font-medium leading-[17px] tracking-[-0.24px] text-[#CBCBCB]'
        }
      >
        {label}
      </span>
    </span>
  )
}

type BooleanPillsProps = {
  active: boolean
  trueLabel?: string
  falseLabel?: string
  falseFirst?: boolean
  keepTrackingWhenSelected?: boolean
}

export function BooleanPills({
  active,
  trueLabel = '있음',
  falseLabel = '없음',
  falseFirst = false,
  keepTrackingWhenSelected,
}: BooleanPillsProps) {
  const options = falseFirst
    ? [
        { label: falseLabel, value: false },
        { label: trueLabel, value: true },
      ]
    : [
        { label: trueLabel, value: true },
        { label: falseLabel, value: false },
      ]

  return (
    <div className="flex gap-1.5">
      {options.map((option) => (
        <Pill
          key={option.label}
          label={option.label}
          selected={option.value === active}
          keepTrackingWhenSelected={keepTrackingWhenSelected}
        />
      ))}
    </div>
  )
}

export function DetailTag({ text }: { text: string }) {
  return (
    <span className="inline-block max-w-full self-start rounded-[10px] border border-[#874FFF] bg-[rgba(135,79,255,0.1)] px-[15px] py-2 text-[12px] font-semibold leading-[14px] text-[#757474]">
      {text}
    </span>
  )
}
