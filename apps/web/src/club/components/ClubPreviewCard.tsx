import Link from 'next/link'
import type { ReactNode } from 'react'

export const CLUB_PREVIEW_CARD_WIDTH = 110
export const CLUB_PREVIEW_CARD_TEXT_HEIGHT = 54
export const CLUB_PREVIEW_CARD_HEIGHT = CLUB_PREVIEW_CARD_WIDTH + CLUB_PREVIEW_CARD_TEXT_HEIGHT

type Props = {
  href: string
  title: string
  description: string
  imageUri: string
}

// 앱 ClubPreviewCardFrame: 폭 110, radius 15, 흰 배경 + 그림자(0,1,7,0.1). 누르면 opacity 0.9
function ClubPreviewCardFrame({ href, children }: { href?: string; children: ReactNode }) {
  const frameClassName =
    'block w-[110px] shrink-0 rounded-[15px] bg-white shadow-[0_1px_7px_rgba(0,0,0,0.1)]'
  const content = <div className="overflow-hidden rounded-[15px] bg-white">{children}</div>

  if (!href) {
    return <div className={frameClassName}>{content}</div>
  }

  return (
    <Link href={href} className={`${frameClassName} active:opacity-90`}>
      {content}
    </Link>
  )
}

// 앱 ClubPreviewCard와 동일: 정사각 이미지(cover) + 텍스트 영역 54(px 10, pt 9, pb 8)
// (tailwind aspectRatio 코어 플러그인이 꺼져 있어 정사각형은 고정 높이로 만든다)
export function ClubPreviewCard({ href, title, description, imageUri }: Props) {
  return (
    <ClubPreviewCardFrame href={href}>
      <div className="h-[110px] w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUri} alt={`${title} 로고`} className="h-full w-full object-cover" />
      </div>
      <div className="h-[54px] bg-white px-2.5 pb-2 pt-[9px]">
        <p className="mb-[3px] truncate text-[14px] font-semibold leading-[17px] text-[#202020]">
          {title}
        </p>
        <p className="truncate text-[12px] font-normal leading-[15px] text-[#757474]">
          {description}
        </p>
      </div>
    </ClubPreviewCardFrame>
  )
}

// 앱 ClubPreviewCardSkeleton: 카드 프레임 안에 배경(#FAFAFA)/하이라이트(흰색) 플레이스홀더
export function ClubPreviewCardSkeleton() {
  return (
    <ClubPreviewCardFrame>
      <div className="h-[110px] w-full animate-pulse bg-[#FAFAFA]" />
      <div className="h-[54px] animate-pulse px-2.5 pb-2 pt-[9px]">
        <div className="mb-[3px] h-4 w-[72px] rounded bg-[#FAFAFA]" />
        <div className="h-[15px] w-[88px] rounded bg-[#FAFAFA]" />
      </div>
    </ClubPreviewCardFrame>
  )
}
