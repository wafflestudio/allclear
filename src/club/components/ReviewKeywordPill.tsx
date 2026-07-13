import { CategoryTheme } from '../constants'

type Props = {
  iconUri: string // 이모지 문자열
  title: string
  theme: CategoryTheme
}

// 히어로 카드의 키워드 알약 (앱 ReviewKeywordPill과 동일)
export function ReviewKeywordPill({ iconUri, title, theme }: Props) {
  return (
    <span
      className="flex min-h-[20px] min-w-0 items-center rounded-[24px] border-[0.5px] pb-[5px] pl-1.5 pr-1.5 pt-1"
      style={{ borderColor: theme.themeColor, backgroundColor: theme.backgroundColor }}
    >
      <span className="mr-1 text-[8.5px]">{iconUri}</span>
      <span className="truncate text-[10px] font-normal text-[#757474]">{title}</span>
    </span>
  )
}
