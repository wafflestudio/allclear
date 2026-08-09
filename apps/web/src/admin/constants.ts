import type { AdminTab, ClubStatus, StatusFilter } from 'src/admin/types'
import type { ClubCollegeMajor } from 'src/entities/club'

export const ADMIN_AUTH_TOKEN_KEY = 'allclear:admin-auth-token'
export const ADMIN_PAGE_SIZE = 20

export const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: '전체', value: 'ALL' },
  { label: '대기', value: 'PENDING' },
  { label: '승인', value: 'APPROVED' },
  { label: '반려', value: 'REJECTED' },
]

export const TABS: { label: string; value: AdminTab }[] = [
  { label: '동아리 신청', value: 'clubs' },
  { label: '관리자 매핑', value: 'managerRequests' },
  { label: '공식 인증', value: 'verificationRequests' },
  { label: '수정 이력', value: 'histories' },
]

export const statusLabels: Record<ClubStatus, string> = {
  PENDING: '대기',
  APPROVED: '승인',
  REJECTED: '반려',
}

export const statusClassNames: Record<ClubStatus, string> = {
  PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
  APPROVED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  REJECTED: 'border-rose-200 bg-rose-50 text-rose-700',
}

export const formatDate = (date: string) => {
  if (!date) return '-'
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export const buildQuery = (params: Record<string, string | number | undefined>) => {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') searchParams.set(key, String(value))
  })
  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

export const formatCollegeMajorLabel = (collegeMajor: ClubCollegeMajor) =>
  collegeMajor.major ?? collegeMajor.college ?? ''
