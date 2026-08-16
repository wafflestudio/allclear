import type { CategoryTheme } from '../constants'

type Props = {
  iconUri: string // 이모지 문자열
  title: string
  theme: CategoryTheme
}

// 앱 shared/components/ReviewKeywordPill 과 동일:
// radius 24, 테두리 0.5 테마색, 테마 배경, minHeight 20, 좌우 6, 위 4 아래 5,
// 텍스트 10/400 lineHeight 10 #757474 (아이콘 8.5, 오른쪽 여백 4), 한 줄 말줄임
export function ReviewKeywordPill({ iconUri, title, theme }: Props) {
  return (
    <span
      className="flex min-h-[20px] min-w-0 shrink items-center rounded-[24px] border-[0.5px] pb-[5px] pl-1.5 pr-1.5 pt-1"
      style={{ borderColor: theme.themeColor, backgroundColor: theme.backgroundColor }}
    >
      <span className="mr-1 text-[8.5px] font-normal leading-[10px]">{iconUri?.trim()}</span>
      <span className="truncate text-[10px] font-normal leading-[10px] text-[#757474]">
        {title}
      </span>
    </span>
  )
}
