import { ClubSearchFilters } from '../../api'
import { MdiIcon } from '../icons'
import { FilterChip } from './FilterChip'

const AFFILIATION_OPTIONS = ['중앙동아리', '학과/단과대동아리'] as const

type Props = {
  filters: ClubSearchFilters
  onChange: (filters: ClubSearchFilters) => void
  onToggleOverlay: () => void
}

// 앱 SearchFilterBar와 동일: tune 아이콘 + 소속 칩(전체/중앙/학과단과대) + 현재 모집중 체크박스
export function SearchFilterBar({ filters, onChange, onToggleOverlay }: Props) {
  const noneSelected = filters.affiliation_types.length === 0

  const toggleAffiliation = (value: (typeof AFFILIATION_OPTIONS)[number]) => {
    const next = filters.affiliation_types.includes(value)
      ? filters.affiliation_types.filter((it) => it !== value)
      : [...filters.affiliation_types, value]
    onChange({ ...filters, affiliation_types: next })
  }

  const toggleRecruiting = () => {
    onChange({
      ...filters,
      is_recruiting: filters.is_recruiting === 'true' ? undefined : 'true',
    })
  }

  return (
    <div className="flex w-full items-center justify-between gap-2">
      <button
        type="button"
        onClick={onToggleOverlay}
        aria-label="상세 필터"
        className="shrink-0 text-[#874FFF] active:opacity-60"
      >
        <MdiIcon name="tune" size={15} />
      </button>

      <div className="flex min-w-0 items-center gap-[5px]">
        <FilterChip
          label="전체"
          selected={noneSelected}
          onToggle={() => onChange({ ...filters, affiliation_types: [] })}
          className="px-[13px]"
        />
        {AFFILIATION_OPTIONS.map((option) => (
          <FilterChip
            key={option}
            label={option}
            selected={filters.affiliation_types.includes(option)}
            onToggle={() => toggleAffiliation(option)}
            className="px-[13px]"
          />
        ))}
      </div>

      <button
        type="button"
        onClick={toggleRecruiting}
        className="flex shrink-0 items-center gap-1 text-[#874FFF] active:opacity-70"
      >
        <MdiIcon
          name={filters.is_recruiting === 'true' ? 'checkboxMarked' : 'checkboxBlank'}
          size={14}
        />
        <span className="text-[12px] font-semibold leading-[14px]">현재 모집중</span>
      </button>
    </div>
  )
}
