import { useRouter } from 'next/router'
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react'
import { useQueryClient } from 'react-query'
import { toast } from 'react-toastify'
import { isAppBannerPath, toPathname } from '../appLink'
import { AppModalManager } from './AppModalManager'
import { LoginSheet } from './LoginSheet'
import { authFetch, clearLoginToken, getLoginToken } from './token'
import type { Term } from './usePendingTerms'

// GET /api/v2/users/me 의 profile (server/domain/model/User.ts)
export type User = {
  id: string
  serviceUserId: string
  nickname: string
  name: string
  phone: string
  email: string
  collegeMajor: {
    id: number
    college: string | null
    major: string | null
  } | null
  admissionClass: number | null
}

export { consumeLoginNextPath, startKakaoLogin } from './kakaoLogin'
export type { Term }

type AuthContextValue = {
  user: User | null
  isLoading: boolean
  setUser: (user: User | null) => void
  requireLogin: (action: () => void) => void
  openLoginSheet: () => void
  closeLoginSheet: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export async function fetchProfile(): Promise<User> {
  const res = await authFetch<{ profile: User }>('/api/v2/users/me')
  return res.profile
}

/**
 * 앱의 ProfileProvider + LoginBottomSheetProvider + AppModalManager 를 합친 전역 컨텍스트.
 * - 시작 시 토큰이 있으면 프로필 복원 (앱 ProfileProvider)
 * - requireLogin: 비로그인 시 로그인 바텀시트 (앱 useRequireLogin)
 * - /club 하위 화면(앱 미러)에서는 약관 동의 → 공지 모달을 전역으로 띄운다 (앱 AppModalManager)
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const queryClient = useQueryClient()
  const router = useRouter()

  useEffect(() => {
    if (!getLoginToken()) {
      setIsLoading(false)
      return
    }
    fetchProfile()
      .then(setUser)
      .catch(() => {
        clearLoginToken()
        setUser(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const requireLogin = useCallback(
    (action: () => void) => {
      if (user) {
        action()
        return
      }
      // 웹 로그인은 OAuth 리다이렉트라 로그인 후 action 을 이어서 실행하지 못한다.
      setIsSheetOpen(true)
    },
    [user],
  )

  const openLoginSheet = useCallback(() => setIsSheetOpen(true), [])
  const closeLoginSheet = useCallback(() => setIsSheetOpen(false), [])

  // 앱 MyPageScreen.confirmLogout 과 동일한 캐시 정리 + 토스트
  const logout = useCallback(() => {
    clearLoginToken()
    setUser(null)
    queryClient.setQueryData(['savedClubs'], { clubs: [], totalSize: 0 })
    queryClient.invalidateQueries(['recentSearches'])
    queryClient.removeQueries(['manageClubs'])
    queryClient.removeQueries(['myClubReview'])
    queryClient.removeQueries(['userNotifications'])
    queryClient.removeQueries(['terms'])
    toast.info('로그아웃 되었어요!')
  }, [queryClient])

  // 앱 미러(/club 하위)에서만 전역 모달을 띄운다. 로그인 콜백·약관 페이지·관리자 등은 제외.
  const showsAppModals = isAppBannerPath(toPathname(router.asPath))

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        setUser,
        requireLogin,
        openLoginSheet,
        closeLoginSheet,
        logout,
      }}
    >
      {children}
      {isSheetOpen && <LoginSheet onClose={closeLoginSheet} />}
      {showsAppModals && <AppModalManager isLoggedIn={!!user} isProfileLoading={isLoading} />}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function useProfile() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useProfile must be used within AuthProvider')
  return { user: ctx.user, isLoading: ctx.isLoading, setUser: ctx.setUser, logout: ctx.logout }
}

export function useRequireLogin() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useRequireLogin must be used within AuthProvider')
  return ctx.requireLogin
}
