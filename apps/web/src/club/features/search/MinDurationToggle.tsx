import { useCallback, useLayoutEffect, useRef, useState } from 'react'

type PeriodValue = '0' | '1' | '2' | '3_plus'

// 앱 MIN_DURATION_OPTIONS
const OPTIONS: { label: string; value: PeriodValue }[] = [
  { label: '없음(0학기)', value: '0' },
  { label: '1학기', value: '1' },
  { label: '2학기', value: '2' },
  { label: '3학기 이상', value: '3_plus' },
]
const ORDER = OPTIONS.map((option) => option.value)

// 앱 상수: THUMB_SIZE 10, 트랙 높이 4, 스텝 닷 12 (선택 16, 테두리 2, 안쪽 8)
const THUMB_SIZE = 10
const TRACK_HEIGHT = 4
const STEP_DOT_SIZE = 12
const STEP_DOT_SELECTED_SIZE = 16
const STEP_DOT_INNER_SIZE = 8

type Props = {
  selected: PeriodValue[]
  onChange: (next: PeriodValue[]) => void
}

/**
 * 앱 MinDurationToggle과 동일: "최소활동기간" 다중 선택 스텝-닷 슬라이더.
 * - 트랙은 첫 라벨의 절반 ~ 마지막 라벨의 절반 사이에 놓이고, 스텝은 그 위에 균등 배치
 * - 인접한 두 스텝이 모두 선택되면 사이 트랙을 포인트컬러로 잇는다
 * - 첫/마지막 라벨은 양끝, 나머지 라벨은 스텝 중심에 맞춘다 (라벨 폭을 실제로 측정)
 */
export function MinDurationToggle({ selected, onChange }: Props) {
  const labelsRowRef = useRef<HTMLDivElement>(null)
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([])
  const [labelsContainerWidth, setLabelsContainerWidth] = useState(0)
  const [labelWidths, setLabelWidths] = useState<number[]>([])

  const measure = useCallback(() => {
    const containerWidth = labelsRowRef.current?.getBoundingClientRect().width ?? 0
    const widths = OPTIONS.map((_, i) => labelRefs.current[i]?.getBoundingClientRect().width ?? 0)
    setLabelsContainerWidth((prev) => (prev === containerWidth ? prev : containerWidth))
    setLabelWidths((prev) =>
      prev.length === widths.length && prev.every((w, i) => w === widths[i]) ? prev : widths,
    )
  }, [])

  useLayoutEffect(() => {
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => measure())
    if (labelsRowRef.current) observer.observe(labelsRowRef.current)
    for (const el of labelRefs.current) {
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [measure])

  // 앱 getValidSelectedValues: 옵션 순서대로 정렬된 선택값
  const selectedValues = Array.from(new Set(selected.filter((v) => ORDER.includes(v)))).sort(
    (a, b) => ORDER.indexOf(a) - ORDER.indexOf(b),
  )
  const selectedSet = new Set(selectedValues)

  const toggle = (value: PeriodValue) => {
    const next = selectedSet.has(value)
      ? selectedValues.filter((it) => it !== value)
      : [...selectedValues, value].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b))
    onChange(next)
  }

  const firstLabelWidth = labelWidths[0] ?? 0
  const lastLabelWidth = labelWidths[OPTIONS.length - 1] ?? 0
  const trackStart = firstLabelWidth / 2
  const trackEnd = Math.max(labelsContainerWidth - lastLabelWidth / 2, trackStart)
  const trackWidth = Math.max(trackEnd - trackStart, 0)
  const stepCenters = OPTIONS.map((_, i) => trackStart + (trackWidth * i) / (OPTIONS.length - 1))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col items-start">
        <p className="h-[18px] text-[12px] font-medium leading-[14px] text-[#757474]">
          최소활동기간
        </p>
      </div>

      <div className="flex w-full flex-col gap-2">
        {/* 트랙 + 스텝 닷 */}
        <div className="relative w-full" style={{ height: THUMB_SIZE }}>
          <div
            className="absolute rounded-full bg-[#C1C1C1]"
            style={{
              left: trackStart,
              width: trackWidth,
              top: (THUMB_SIZE - TRACK_HEIGHT) / 2,
              height: TRACK_HEIGHT,
            }}
          />
          {OPTIONS.slice(0, -1).map((option, i) => {
            const nextOption = OPTIONS[i + 1]
            if (!selectedSet.has(option.value) || !selectedSet.has(nextOption.value)) return null
            return (
              <div
                key={`${option.value}-${nextOption.value}`}
                className="absolute rounded-full bg-[#874FFF]"
                style={{
                  left: stepCenters[i],
                  width: stepCenters[i + 1] - stepCenters[i],
                  top: (THUMB_SIZE - TRACK_HEIGHT) / 2,
                  height: TRACK_HEIGHT,
                }}
              />
            )
          })}
          {OPTIONS.map((option, i) => {
            const isSelected = selectedSet.has(option.value)
            const size = isSelected ? STEP_DOT_SELECTED_SIZE : STEP_DOT_SIZE
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggle(option.value)}
                aria-label={option.label}
                aria-pressed={isSelected}
                className={`absolute z-[1] flex items-center justify-center rounded-full border-2 bg-white before:absolute before:-inset-2 before:content-[''] ${
                  isSelected ? 'border-[#874FFF]' : 'border-[#C1C1C1]'
                }`}
                style={{
                  left: stepCenters[i] - size / 2,
                  top: (THUMB_SIZE - size) / 2,
                  width: size,
                  height: size,
                }}
              >
                {isSelected ? (
                  <span
                    className="rounded-full bg-[#874FFF]"
                    style={{ width: STEP_DOT_INNER_SIZE, height: STEP_DOT_INNER_SIZE }}
                  />
                ) : null}
              </button>
            )
          })}
        </div>

        {/* 라벨 행 */}
        <div ref={labelsRowRef} className="relative h-[18px] w-full">
          {OPTIONS.map((option, i) => (
            <span
              key={option.value}
              ref={(el) => {
                labelRefs.current[i] = el
              }}
              className="absolute top-0 whitespace-nowrap text-center text-[12px] font-normal leading-[18px] text-[#757474]"
              style={
                i === 0
                  ? { left: 0 }
                  : i === OPTIONS.length - 1
                    ? { right: 0 }
                    : { left: stepCenters[i] - (labelWidths[i] ?? 0) / 2 }
              }
            >
              {option.label}
            </span>
          ))}
        </div>

        <p className="text-center text-[12px] font-normal leading-[18px] text-[#757474]">
          원하는 기간을 모두 선택해보세요.
        </p>
      </div>
    </div>
  )
}
