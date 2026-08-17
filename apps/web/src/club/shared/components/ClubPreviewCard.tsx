import Link from 'next/link'

export const CLUB_PREVIEW_CARD_WIDTH = 110
export const CLUB_PREVIEW_CARD_TEXT_HEIGHT = 54

type Props = {
  href: string
  title: string
  description: string
  imageUri: string
}

// 앱 ClubPreviewCard와 동일: 폭 110, 정사각 이미지, 텍스트 영역 54, radius 15
export function ClubPreviewCard({ href, title, description, imageUri }: Props) {
  return (
    <Link
      href={href}
      className="block w-[110px] shrink-0 rounded-[15px] bg-white shadow-[0_1px_7px_rgba(0,0,0,0.1)] active:opacity-90"
    >
      <div className="overflow-hidden rounded-[15px] bg-white">
        <div className="aspect-square w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUri} alt={`${title} 로고`} className="h-full w-full object-cover" />
        </div>
        <div className="h-[54px] bg-white px-2.5 pb-2 pt-[9px]">
          <p className="mb-[3px] truncate text-[14px] font-semibold text-[#202020]">{title}</p>
          <p className="truncate text-[12px] font-normal leading-[15px] text-[#757474]">
            {description}
          </p>
        </div>
      </div>
    </Link>
  )
}

export function ClubPreviewCardSkeleton() {
  return (
    <div className="w-[110px] shrink-0 animate-pulse overflow-hidden rounded-[15px] bg-white shadow-[0_1px_7px_rgba(0,0,0,0.1)]">
      <div className="aspect-square w-full bg-[#F3F0F5]" />
      <div className="h-[54px] px-2.5 pb-2 pt-[9px]">
        <div className="mb-[3px] h-4 w-[72px] rounded bg-[#F3F0F5]" />
        <div className="h-[15px] w-[88px] rounded bg-[#F3F0F5]" />
      </div>
    </div>
  )
}
