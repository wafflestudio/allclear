import { CategoryTheme } from '../constants'

type Props = {
  iconUri: string // 이모지 문자열
  title: string
  totalUpvotes: number
  totalReviews: number
  theme: CategoryTheme
}

// 활동후기 탭의 공감 게이지 바 (앱 ReviewKeywordBar와 동일)
export function ReviewKeywordBar({ iconUri, title, totalUpvotes, totalReviews, theme }: Props) {
  const ratio = totalReviews > 0 ? Math.min(Math.max(totalUpvotes / totalReviews, 0), 1) : 0

  return (
    <div
      className="relative flex h-[31px] items-center overflow-hidden rounded-[24px] border-[0.5px] bg-white"
      style={{ borderColor: theme.themeColor }}
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-0"
        style={{
          width: `${ratio * 100}%`,
          background: `linear-gradient(to right, ${theme.themeColor}40, ${theme.themeColor}00)`,
        }}
      />
      <div className="relative flex min-w-0 flex-1 items-center justify-between pl-[15px] pr-5">
        <span className="flex min-w-0 items-center">
          <span className="mr-1 text-[12px] font-medium">{iconUri}</span>
          <span className="truncate text-[12px] font-medium text-[#757474]">{title}</span>
        </span>
        <span className="ml-2 text-[12px] font-medium text-[#757474]">{totalUpvotes}</span>
      </div>
    </div>
  )
}
