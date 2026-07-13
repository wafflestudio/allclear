import { ClubSearchFilters, DEFAULT_SEARCH_FILTERS } from '../../api'
import { MdiIcon } from '../icons'
import { FilterChip } from './FilterChip'
import { MinDurationToggle } from './MinDurationToggle'

type Props = {
  filters: ClubSearchFilters
  onChange: (filters: ClubSearchFilters) => void
  onClose: () => void
}

// 앱 SearchFilterOverlay와 동일: 딤 + 하단 라운드 패널 (모집형태/동방/회비 + 최소활동기간)
export function SearchFilterOverlay({ filters, onChange, onClose }: Props) {
  // 오버레이 필터만 초기화 (소속/모집중은 유지 — 앱과 동일)
  const resetOverlayFilters = () => {
    onChange({
      ...filters,
      recruit_type: undefined,
      has_membership_fee: undefined,
      has_dongbang: undefined,
      min_activity_period: DEFAULT_SEARCH_FILTERS.min_activity_period,
    })
  }

  const toggleSingle = <K extends 'recruit_type' | 'has_dongbang' | 'has_membership_fee'>(
    key: K,
    value: NonNullable<ClubSearchFilters[K]>,
  ) => {
    onChange({ ...filters, [key]: filters[key] === value ? undefined : value })
  }

  return (
    <div className="absolute inset-0 z-10">
      <button
        type="button"
        aria-label="필터 닫기"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/20"
      />
      <div className="relative z-10 flex flex-col gap-[18px] rounded-b-[15px] bg-[#FAFAFA] pb-[31px] pl-[34px] pr-5 pt-[27px] shadow-[0_4px_4px_rgba(0,0,0,0.1)]">
        <div className="flex items-start justify-between">
          <p className="flex-1 text-[12px] font-normal leading-[18px] text-[#757474]">
            더 자세한 검색을 위해 상세필터를 설정해보세요!
          </p>
          <button
            type="button"
            onClick={resetOverlayFilters}
            aria-label="필터 초기화"
            className="ml-4 text-[#874FFF] active:opacity-60"
          >
            <MdiIcon name="reload" size={15} />
          </button>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-start gap-[15px]">
            <div className="flex gap-2">
              <FilterChip
                label="정기모집"
                selected={filters.recruit_type === '정기'}
                onToggle={() => toggleSingle('recruit_type', '정기')}
              />
              <FilterChip
                label="상시모집"
                selected={filters.recruit_type === '상시'}
                onToggle={() => toggleSingle('recruit_type', '상시')}
              />
            </div>
            <FilterChip
              label="동방보유"
              selected={filters.has_dongbang === 'true'}
              onToggle={() => toggleSingle('has_dongbang', 'true')}
            />
            <FilterChip
              label="회비없음"
              selected={filters.has_membership_fee === 'false'}
              onToggle={() => toggleSingle('has_membership_fee', 'false')}
            />
          </div>

          <MinDurationToggle
            selected={filters.min_activity_period}
            onChange={(next) => onChange({ ...filters, min_activity_period: next })}
          />
        </div>
      </div>
    </div>
  )
}
