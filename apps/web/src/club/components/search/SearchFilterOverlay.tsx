import { type ClubSearchFilters, DEFAULT_SEARCH_FILTERS } from '../../api'
import { MdiIcon } from '../icons'
import { FilterChip } from './FilterChip'
import { MinDurationToggle } from './MinDurationToggle'

type Props = {
  value: ClubSearchFilters
  onChange: (filters: ClubSearchFilters) => void
  onReset: () => void
  onClose: () => void
}

// 앱 RECRUITMENT_OPTIONS / ROOM_OPTIONS / FEE_OPTIONS
const RECRUITMENT_OPTIONS = [
  { label: '정기모집', value: '정기' },
  { label: '상시모집', value: '상시' },
] as const

// 앱 resetClubSearchOverlayFilters: 소속/모집중은 유지하고 오버레이 필터만 초기화
export function resetClubSearchOverlayFilters(filters: ClubSearchFilters): ClubSearchFilters {
  return {
    ...filters,
    recruit_type: undefined,
    has_membership_fee: undefined,
    has_dongbang: undefined,
    min_activity_period: DEFAULT_SEARCH_FILTERS.min_activity_period,
  }
}

/**
 * 앱 SearchFilterOverlay와 동일: 결과 영역을 덮는 딤(rgba(0,0,0,0.2)) + 위에서 내려오는 패널
 * (bg #FAFAFA, 아래 모서리 15, 위 27 / 오른쪽 20 / 아래 31 / 왼쪽 34, 그림자 0 4 4 0.1).
 * 안내 문구 + 초기화(reload 15) / [정기모집·상시모집](단일) [동방보유] [회비없음] / 최소활동기간
 * 렌더 위치(부모)는 검색 페이지가 잡는다: 앱처럼 헤더+필터바 바로 아래, 탭바 위까지.
 */
export function SearchFilterOverlay({ value, onChange, onReset, onClose }: Props) {
  const toggleSingle = <K extends 'recruit_type' | 'has_dongbang' | 'has_membership_fee'>(
    key: K,
    next: NonNullable<ClubSearchFilters[K]>,
  ) => {
    // 앱 useSearchFilterToggleGroup(single): 선택된 값을 다시 누르면 해제(none)
    onChange({ ...value, [key]: value[key] === next ? undefined : next })
  }

  return (
    <div className="absolute inset-0 z-10">
      <button
        type="button"
        aria-label="필터 닫기"
        onClick={onClose}
        className="absolute inset-0 cursor-default touch-none bg-black/20"
      />
      <div className="relative z-10 flex flex-col gap-[18px] rounded-b-[15px] bg-[#FAFAFA] pb-[31px] pl-[34px] pr-5 pt-[27px] shadow-[0_4px_4px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-between">
          <p className="flex-1 text-[12px] font-normal leading-[18px] text-[#757474]">
            더 자세한 검색을 위해 상세필터를 설정해보세요!
          </p>
          <button
            type="button"
            onClick={onReset}
            aria-label="필터 초기화"
            className="-m-2 ml-2 flex items-center justify-center p-2 text-[#874FFF] active:opacity-[0.65]"
          >
            <MdiIcon name="reload" size={15} />
          </button>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-start gap-[15px]">
            <div className="flex flex-wrap gap-2">
              {RECRUITMENT_OPTIONS.map((option) => (
                <FilterChip
                  key={option.value}
                  label={option.label}
                  selected={value.recruit_type === option.value}
                  onToggle={() => toggleSingle('recruit_type', option.value)}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterChip
                label="동방보유"
                selected={value.has_dongbang === 'true'}
                onToggle={() => toggleSingle('has_dongbang', 'true')}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterChip
                label="회비없음"
                selected={value.has_membership_fee === 'false'}
                onToggle={() => toggleSingle('has_membership_fee', 'false')}
              />
            </div>
          </div>

          <MinDurationToggle
            selected={value.min_activity_period}
            onChange={(next) => onChange({ ...value, min_activity_period: next })}
          />
        </div>
      </div>
    </div>
  )
}
