// 앱 ClubDetail/ClubDetailTabBar.tsx 와 동일한 탭 키/라벨
export const CLUB_DETAIL_TABS = {
  detail: '상세정보',
  recruit: '모집공고',
  review: '활동후기',
} as const

export type ClubTabKey = keyof typeof CLUB_DETAIL_TABS
export type ClubTabLabel = (typeof CLUB_DETAIL_TABS)[ClubTabKey]

export const CLUB_TABS: { key: ClubTabKey; label: ClubTabLabel }[] = (
  Object.keys(CLUB_DETAIL_TABS) as ClubTabKey[]
).map((key) => ({ key, label: CLUB_DETAIL_TABS[key] }))

type Props = {
  activeTab: ClubTabKey
  onChange: (tab: ClubTabKey) => void
}

// 앱과 동일: 배경 #FAFAFA, 하단 1px #BCBCBC, 탭 상하 12, 라벨 14 (활성 600 POINTCOLOR / 비활성 500 #757474),
// 라벨 아래 4px 여백, 활성 밑줄 2px radius 2 (좌우 16 인셋, 하단 경계선 위에 겹침)
export function ClubDetailTabBar({ activeTab, onChange }: Props) {
  return (
    <div className="flex border-b border-[#BCBCBC] bg-[#FAFAFA]">
      {CLUB_TABS.map(({ key, label }) => {
        const isActive = key === activeTab
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className="relative flex flex-1 flex-col items-center py-3"
          >
            <span
              className={`mb-1 text-[14px] ${
                isActive ? 'font-semibold text-[#874FFF]' : 'font-medium text-[#757474]'
              }`}
            >
              {label}
            </span>
            <span
              className={`absolute inset-x-4 -bottom-px h-[2px] rounded-[2px] ${
                isActive ? 'bg-[#874FFF]' : 'bg-transparent'
              }`}
            />
          </button>
        )
      })}
    </div>
  )
}
