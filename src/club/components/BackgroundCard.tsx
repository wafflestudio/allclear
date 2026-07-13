import { ReactNode } from 'react'

type Props = {
  children: ReactNode
  className?: string
}

// 앱의 BackgroundCard와 동일: 흰 배경, radius 16, padding 16, 은은한 그림자
export function BackgroundCard({ children, className }: Props) {
  return (
    <div
      className={`rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)] ${className ?? ''}`}
    >
      {children}
    </div>
  )
}
