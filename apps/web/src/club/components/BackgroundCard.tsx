import type { CSSProperties, ReactNode } from 'react'

type Props = {
  children: ReactNode
  className?: string
  style?: CSSProperties
}

// 앱의 BackgroundCard와 동일: 흰 배경, radius 16, padding 16, 그림자 (0,2) 6% blur 8
// (앱과 마찬가지로 자식이 absolute 로 덮을 수 있게 relative 로 둔다 — LoginBlurOverlay 등)
export function BackgroundCard({ children, className, style }: Props) {
  return (
    <div
      className={`relative rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)] ${className ?? ''}`}
      style={style}
    >
      {children}
    </div>
  )
}
