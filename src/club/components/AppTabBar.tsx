import Link from 'next/link'
import { useRouter } from 'next/router'

type TabKey = 'home' | 'explore' | 'saved' | 'mypage'

const TABS: { key: TabKey; label: string; href: string }[] = [
  { key: 'home', label: '홈', href: '/club' },
  { key: 'explore', label: '탐색', href: '/search' },
  { key: 'saved', label: '저장', href: '/saved' },
  { key: 'mypage', label: '마이', href: '/mypage' },
]

type Props = {
  active: TabKey
}

// 앱 하단 탭바와 동일: 높이 86, bg #F3F0F5, 아이콘 22, 라벨 12/500, 활성 #874FFF
// 저장/마이 페이지는 자체적으로 로그인 게이트를 띄운다 (앱의 tabPress requireLogin과 동일한 효과).
export function AppTabBar({ active }: Props) {
  const router = useRouter()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30">
      <div className="mx-auto flex h-[86px] max-w-[480px] bg-[#F3F0F5] pb-[26px]">
        {TABS.map((tab) => {
          const isActive = tab.key === active
          const icon = `/icons/tab/${tab.key}-${isActive ? 'active' : 'default'}.png`
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className="flex flex-1 flex-col items-center active:opacity-60"
              onClick={(e) => {
                // 앱과 동일: 현재 탭 재탭 시 해당 화면 초기화
                if (router.pathname === tab.href) {
                  e.preventDefault()
                  router.replace(tab.href)
                }
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={icon} alt="" width={22} height={22} className="mt-2.5 object-contain" />
              <span
                className={`mt-1 text-[12px] font-medium ${
                  isActive ? 'text-[#874FFF]' : 'text-[#C1C1C1]'
                }`}
              >
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
