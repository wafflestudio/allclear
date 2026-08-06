type PeriodValue = '0' | '1' | '2' | '3_plus'

const OPTIONS: { label: string; value: PeriodValue }[] = [
  { label: '없음(0학기)', value: '0' },
  { label: '1학기', value: '1' },
  { label: '2학기', value: '2' },
  { label: '3학기 이상', value: '3_plus' },
]

type Props = {
  selected: PeriodValue[]
  onChange: (next: PeriodValue[]) => void
}

// 앱 MinDurationToggle과 동일: 다중 선택 스텝-닷 슬라이더
export function MinDurationToggle({ selected, onChange }: Props) {
  const toggle = (value: PeriodValue) => {
    onChange(
      selected.includes(value) ? selected.filter((it) => it !== value) : [...selected, value],
    )
  }

  const positions = OPTIONS.map((_, i) => (i / (OPTIONS.length - 1)) * 100)

  return (
    <div className="flex flex-col gap-3">
      <p className="h-[18px] text-[12px] font-medium text-[#757474]">최소활동기간</p>
      <div className="flex w-full flex-col gap-2">
        {/* 트랙 + 스텝 닷 */}
        <div className="relative mx-8 h-4">
          <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#C1C1C1]" />
          {/* 인접한 두 스텝이 모두 선택되면 연결 트랙을 포인트컬러로 */}
          {OPTIONS.slice(0, -1).map((option, i) =>
            selected.includes(option.value) && selected.includes(OPTIONS[i + 1].value) ? (
              <div
                key={option.value}
                className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#874FFF]"
                style={{
                  left: `${positions[i]}%`,
                  width: `${positions[i + 1] - positions[i]}%`,
                }}
              />
            ) : null,
          )}
          {OPTIONS.map((option, i) => {
            const isSelected = selected.includes(option.value)
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggle(option.value)}
                aria-label={option.label}
                aria-pressed={isSelected}
                className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 p-1.5"
                style={{ left: `${positions[i]}%` }}
              >
                {isSelected ? (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-[#874FFF] bg-white">
                    <span className="h-2 w-2 rounded-full bg-[#874FFF]" />
                  </span>
                ) : (
                  <span className="block h-3 w-3 rounded-full border-2 border-[#C1C1C1] bg-white" />
                )}
              </button>
            )
          })}
        </div>
        {/* 라벨 행 */}
        <div className="relative h-[18px] w-full">
          {OPTIONS.map((option, i) => (
            <span
              key={option.value}
              className="absolute top-0 text-center text-[12px] font-normal leading-[18px] text-[#757474]"
              style={
                i === 0
                  ? { left: 0 }
                  : i === OPTIONS.length - 1
                  ? { right: 0 }
                  : {
                      left: `calc(2rem + (100% - 4rem) * ${positions[i] / 100})`,
                      transform: 'translateX(-50%)',
                    }
              }
            >
              {option.label}
            </span>
          ))}
        </div>
      </div>
      <p className="text-center text-[12px] font-normal leading-[18px] text-[#757474]">
        원하는 기간을 모두 선택해보세요.
      </p>
    </div>
  )
}
