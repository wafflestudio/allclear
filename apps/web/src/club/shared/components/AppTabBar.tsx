import Link from 'next/link'
import { useRouter } from 'next/router'
import { useProfile, useRequireLogin } from '../../auth/AuthContext'

type TabKey = 'home' | 'explore' | 'saved' | 'mypage'

// 앱 TabNavigator: 홈 / 탐색 / (등록: 탭바 미노출) / 저장 / 마이
const TABS: { key: TabKey; label: string; href: string; requiresLogin: boolean }[] = [
  { key: 'home', label: '홈', href: '/club', requiresLogin: false },
  { key: 'explore', label: '탐색', href: '/club/search', requiresLogin: false },
  { key: 'saved', label: '저장', href: '/club/saved', requiresLogin: true },
  { key: 'mypage', label: '마이', href: '/club/mypage', requiresLogin: true },
]

type Props = {
  active: TabKey
}

/**
 * 앱 하단 탭바와 동일:
 * - 높이 70+16=86, 아래 패딩 10+16=26, 배경 #F3F0F5, 상단 테두리/그림자 없음
 * - 탭 아이템: 아이콘 영역(flex 1, 아이콘 22×22 + 위 여백 10 을 가운데 정렬) 위에, 라벨 12/500 은 맨 아래
 * - 라벨 색: 활성 #874FFF / 비활성 #C1C1C1, 누르면 opacity 0.6
 * - 저장/마이 탭은 로그인 필요 (앱 tabPress 리스너의 requireLogin 과 동일: 비로그인 시 로그인 시트)
 * - 이미 보고 있는 탭을 다시 누르면 그 화면을 초기 상태로 되돌린다 (앱 tabPress → reset)
 */
export function AppTabBar({ active }: Props) {
  const router = useRouter()
  const { user, isLoading } = useProfile()
  const requireLogin = useRequireLogin()

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
              aria-current={isActive ? 'page' : undefined}
              className="flex flex-1 flex-col items-center justify-end active:opacity-60"
              onClick={(e) => {
                // 앱: 저장/마이 탭은 로그인 시트를 띄우고, 로그인돼 있으면 이동
                if (tab.requiresLogin && !isLoading && !user) {
                  e.preventDefault()
                  requireLogin(() => router.push(tab.href))
                  return
                }
                // 앱: 현재 탭 재탭 시 해당 화면 초기화 (같은 URL로 replace → 페이지가 상태를 되돌린다)
                if (router.pathname === tab.href) {
                  e.preventDefault()
                  router.replace(tab.href)
                }
              }}
            >
              <span className="flex min-h-0 flex-1 items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={icon}
                  alt=""
                  width={22}
                  height={22}
                  className="mt-2.5 h-[22px] w-[22px] object-contain"
                />
              </span>
              <span
                className={`text-[12px] font-medium leading-[14px] ${
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
