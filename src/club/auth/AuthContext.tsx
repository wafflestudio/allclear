import Link from 'next/link'
import { ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { toast } from 'react-toastify'
import { authFetch, clearLoginToken, getLoginToken } from './token'

// GET /api/v2/users/me 의 profile (server/domain/model/User.ts)
export type User = {
  id: string
  serviceUserId: string
  nickname: string
  name: string
  phone: string
  email: string
  gender: string
  birthDate: string | null
  birthYear: string
  college: string
  major: string
  admissionClass: number | null
  grade: number | null
}

export type Term = {
  uuid: string
  termsKey: string
  title: string
  contentUrl: string
  version: string
  isMandatory: boolean
}

type AuthContextValue = {
  user: User | null
  isLoading: boolean
  setUser: (user: User | null) => void
  requireLogin: (action: () => void) => void
  openLoginSheet: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export async function fetchProfile(): Promise<User> {
  const res = await authFetch<{ profile: User }>('/api/v2/users/me')
  return res.profile
}

const LOGIN_NEXT_KEY = 'allclear-login-next'

// 카카오 OAuth 시작: 돌아올 경로를 저장하고 인가 페이지로 이동
export function startKakaoLogin() {
  window.sessionStorage.setItem(LOGIN_NEXT_KEY, window.location.pathname + window.location.search)
  window.location.assign('/api/v2/auth/kakao?state=web')
}

export function consumeLoginNextPath(): string {
  const next = window.sessionStorage.getItem(LOGIN_NEXT_KEY)
  window.sessionStorage.removeItem(LOGIN_NEXT_KEY)
  return next || '/club'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const queryClient = useQueryClient()

  // 앱의 ProfileProvider와 동일: 시작 시 토큰이 있으면 프로필 복원
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
      setIsSheetOpen(true)
    },
    [user],
  )

  const openLoginSheet = useCallback(() => setIsSheetOpen(true), [])

  const logout = useCallback(() => {
    clearLoginToken()
    setUser(null)
    queryClient.setQueryData(['savedClubs'], { clubs: [], totalSize: 0 })
    queryClient.removeQueries(['myClubReview'])
    toast.info('로그아웃 되었어요!')
  }, [queryClient])

  return (
    <AuthContext.Provider
      value={{ user, isLoading, setUser, requireLogin, openLoginSheet, logout }}
    >
      {children}
      {isSheetOpen && <LoginSheet onClose={() => setIsSheetOpen(false)} />}
      {user && <TermsAgreementGate />}
    </AuthContext.Provider>
  )
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

// 앱 LoginView와 동일한 디자인의 로그인 바텀시트 (웹은 카카오만 — Apple은 iOS 네이티브 전용)
function LoginSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/20"
      />
      <div className="absolute inset-x-0 bottom-0">
        <div className="mx-auto max-w-[480px] rounded-t-2xl bg-white px-6 py-8 pb-[max(32px,env(safe-area-inset-bottom))]">
          <p className="mb-6 text-center text-[16px] text-[#202020]">
            <span className="font-semibold">로그인</span>
            <span className="font-normal">이 필요해요</span>
          </p>
          <button
            type="button"
            onClick={startKakaoLogin}
            className="relative mb-3 w-full rounded-xl bg-[#FEE500] p-4 active:opacity-80"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/kakao.png"
              alt=""
              width={24}
              height={24}
              className="absolute left-4 top-[13px]"
            />
            <span className="block text-center text-[14px] font-medium text-black">
              카카오톡으로 계속하기
            </span>
          </button>
          <div className="mt-2.5 flex items-center justify-center gap-2 text-[12px] font-normal leading-[18px] text-[#C1C1C1]">
            <Link href="/terms/terms-of-service" className="active:opacity-50">
              서비스 이용약관
            </Link>
            <span>|</span>
            <Link href="/terms/privacy-policy" className="active:opacity-50">
              개인정보 처리방침
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// 앱 TermsAgreementModal: 로그인 상태에서 미동의 약관이 있으면 전역 모달 강제 표시
function TermsAgreementGate() {
  const queryClient = useQueryClient()
  const { data: pendingTerms } = useQuery(
    ['terms'],
    () => authFetch<{ data: Term[] }>('/api/v2/terms'),
    { staleTime: 60000, retry: false, select: (res) => res.data },
  )
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [viewingTerm, setViewingTerm] = useState<Term | null>(null)

  const agreeMutation = useMutation(
    (termUuids: string[]) =>
      authFetch<void>('/api/v2/terms/agree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ termUuids }),
      }),
    { onSuccess: () => queryClient.invalidateQueries(['terms']) },
  )

  if (!pendingTerms || pendingTerms.length === 0) return null

  const allChecked = pendingTerms.every((t) => checked.has(t.uuid))
  const mandatoryChecked = pendingTerms
    .filter((t) => t.isMandatory)
    .every((t) => checked.has(t.uuid))

  const toggle = (uuid: string) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(uuid)) next.delete(uuid)
      else next.add(uuid)
      return next
    })
  }

  const toggleAll = () => {
    setChecked(allChecked ? new Set() : new Set(pendingTerms.map((t) => t.uuid)))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-5 backdrop-blur-[1px]">
      <div className="flex w-full max-w-[440px] flex-col gap-6 rounded-[28px] bg-white px-6 pb-6 pt-5">
        <div className="flex flex-col gap-3">
          <span className="w-fit rounded-full bg-[rgba(135,79,255,0.1)] px-2.5 py-1.5 text-[10px] font-semibold leading-[14px] text-[#874FFF]">
            약관 동의
          </span>
          <p className="text-[25px] font-bold leading-[30px] text-[#202020]">
            약관 동의가 필요해요
          </p>
          <p className="text-[14px] font-normal text-[#757474]">
            서비스 이용을 계속하려면 아래 약관에 동의해 주세요.
          </p>
        </div>
        <div className="max-h-[190px] overflow-y-auto">
          {pendingTerms.map((term) => (
            <div
              key={term.uuid}
              className="flex items-center justify-between border-b border-[#EAEAEA] py-3"
            >
              <button
                type="button"
                onClick={() => toggle(term.uuid)}
                className="flex min-w-0 items-center gap-1 text-left"
              >
                <CheckboxIcon checked={checked.has(term.uuid)} />
                <span className="truncate text-[12px] font-medium text-[#202020]">
                  <span className={term.isMandatory ? 'text-[#E53935]' : ''}>
                    [{term.isMandatory ? '필수' : '선택'}]
                  </span>{' '}
                  {term.title}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setViewingTerm(term)}
                className="ml-2 shrink-0 text-[12px] font-medium text-[#757474] active:opacity-50"
              >
                보기 ›
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={toggleAll} className="flex w-fit items-center gap-1">
          <CheckboxIcon checked={allChecked} />
          <span className="text-[12px] font-medium text-[#874FFF]">전체 동의</span>
        </button>
        <button
          type="button"
          disabled={!mandatoryChecked || agreeMutation.isLoading}
          onClick={() => agreeMutation.mutate(Array.from(checked))}
          className={`mx-auto w-full max-w-[244px] rounded-2xl px-4 py-3.5 text-[16px] font-semibold leading-5 ${
            mandatoryChecked && !agreeMutation.isLoading
              ? 'bg-[#874FFF] text-white active:bg-[#4F2E94]'
              : 'bg-[#EAEAEA] text-[#C1C1C1]'
          }`}
        >
          동의하고 계속하기
        </button>
      </div>

      {viewingTerm && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          <div className="relative flex h-14 items-center px-4">
            <button
              type="button"
              onClick={() => setViewingTerm(null)}
              aria-label="닫기"
              className="z-10 -ml-1 w-8 text-[#757474]"
            >
              <svg
                width={28}
                height={28}
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z" />
              </svg>
            </button>
            <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-[16px] font-semibold text-[#757474]">
              {viewingTerm.title}
            </p>
          </div>
          <iframe
            title={viewingTerm.title}
            src={viewingTerm.contentUrl}
            className="w-full flex-1"
          />
        </div>
      )}
    </div>
  )
}

function CheckboxIcon({ checked }: { checked: boolean }) {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="#874FFF" aria-hidden="true">
      <path
        d={
          checked
            ? 'M19,3H5C3.89,3 3,3.89 3,5V19C3,20.1 3.9,21 5,21H19C20.1,21 21,20.1 21,19V13H19V19H5V5H19V7H21V5C21,3.89 20.1,3 19,3M7.91,10.08L6.5,11.5L11,16L21,6L19.59,4.58L11,13.17L7.91,10.08Z'
            : 'M19,3H5C3.89,3 3,3.89 3,5V19C3,20.1 3.9,21 5,21H19C20.1,21 21,20.1 21,19V5C21,3.89 20.1,3 19,3M19,5V19H5V5H19Z'
        }
      />
    </svg>
  )
}
