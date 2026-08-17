export type ClubTabKey = 'detail' | 'recruit' | 'review'

export const CLUB_TABS: { key: ClubTabKey; label: string }[] = [
  { key: 'detail', label: '상세정보' },
  { key: 'recruit', label: '모집공고' },
  { key: 'review', label: '활동후기' },
]

type Props = {
  activeTab: ClubTabKey
  onChange: (tab: ClubTabKey) => void
}

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
