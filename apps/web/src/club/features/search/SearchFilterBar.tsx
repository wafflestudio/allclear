import type { ClubSearchFilters } from '../../api/clubs'
import { MdiIcon } from '../../shared/components/icons'
import { FilterChip } from './FilterChip'

// 앱 CLUB_TYPE_OPTIONS
const CLUB_TYPE_OPTIONS = ['중앙동아리', '학과/단과대동아리'] as const

type Props = {
  filters: ClubSearchFilters
  onChange: (filters: ClubSearchFilters) => void
  onPressFilter: () => void
}

/**
 * 앱 SearchFilterBar와 동일 (가로 정렬, 양끝 배치):
 * [상세필터(tune 15, #874FFF, hitSlop 8, 누르면 0.65)]
 * [소속 토글 그룹: 전체 / 중앙동아리 / 학과/단과대동아리 — 다중 선택, 간격 5, 좌우 13]
 * [현재 모집중 체크박스: 아이콘 14 + 라벨 12/600 #874FFF, hitSlop 14, 누르면 0.7]
 */
export function SearchFilterBar({ filters, onChange, onPressFilter }: Props) {
  // 앱: affiliation_types 가 비어 있으면 '전체' 선택 상태
  const isAllSelected = filters.affiliation_types.length === 0

  const toggleAffiliation = (value: (typeof CLUB_TYPE_OPTIONS)[number]) => {
    // 앱 useSearchFilterToggleGroup(multiple): 전체 상태에서 누르면 그 값만, 값 상태에서는 토글,
    // 마지막 값을 해제하면 다시 '전체'
    const next = filters.affiliation_types.includes(value)
      ? filters.affiliation_types.filter((it) => it !== value)
      : [...filters.affiliation_types, value]
    onChange({ ...filters, affiliation_types: next })
  }

  const handleToggleRecruiting = () => {
    onChange({
      ...filters,
      is_recruiting: filters.is_recruiting === 'true' ? undefined : 'true',
    })
  }

  const isRecruiting = filters.is_recruiting === 'true'

  return (
    <div className="flex w-full items-center justify-between">
      <button
        type="button"
        onClick={onPressFilter}
        aria-label="상세 필터"
        className="-m-2 flex shrink-0 items-center justify-center p-2 text-[#874FFF] active:opacity-[0.65]"
      >
        <MdiIcon name="tune" size={15} />
      </button>

      <div>
        <div className="flex flex-nowrap items-center gap-[5px]">
          <FilterChip
            label="전체"
            selected={isAllSelected}
            onToggle={() => onChange({ ...filters, affiliation_types: [] })}
            className="px-[13px]"
          />
          {CLUB_TYPE_OPTIONS.map((option) => (
            <FilterChip
              key={option}
              label={option}
              selected={filters.affiliation_types.includes(option)}
              onToggle={() => toggleAffiliation(option)}
              className="px-[13px]"
            />
          ))}
        </div>
      </div>

      <div>
        <button
          type="button"
          role="checkbox"
          aria-checked={isRecruiting}
          onClick={handleToggleRecruiting}
          className="-m-3.5 flex items-center gap-1 p-3.5 text-[#874FFF] active:opacity-70"
        >
          <span className="flex h-[14px] w-[14px] items-center justify-center">
            <MdiIcon name={isRecruiting ? 'checkboxMarked' : 'checkboxBlank'} size={14} />
          </span>
          <span className="text-[12px] font-semibold leading-[14px]">현재 모집중</span>
        </button>
      </div>
    </div>
  )
}
