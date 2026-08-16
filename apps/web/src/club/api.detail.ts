import { useMutation, useQuery, useQueryClient } from 'react-query'
import type { Club } from '../../server/domain/model/Club'
import { authFetch, authHeaders } from './auth/token'
import { getGuestId } from './guestId'

// 동아리 상세 화면(모집공고 탭 · 이전 공고 · 활동 후기 작성)에서 쓰는 API 훅.
// 앱 repositories/recruitment.ts, repositories/review.ts 와 동일한 엔드포인트/파라미터/정규화 규칙.

// ─── Types (앱 repositories/recruitment.ts 와 동일) ─────────────────────────

export type RecruitmentRegularMeeting = {
  day_of_week: string
  start_time: string | null
  end_time: string | null
}

export type RecruitmentSummary = {
  id: number
  display_title: string
  title: string
  deadline: string
  is_active: boolean
}

export type ListClubRecruitmentsResponse = {
  club_name: string
  recruitments: RecruitmentSummary[]
}

export type RepresentativeRecruitment = {
  id: number
  updatedAt: string
} | null

export type RecruitmentContent = {
  title: string
  deadline: string
  is_mandatory: boolean
  has_regular_meeting: boolean
  regular_meetings: RecruitmentRegularMeeting[]
  activity_location_type: string
  activity_location_text: string
  has_eligibility: boolean
  eligibility_text: string
  has_capacity_limit: boolean
  capacity_limit_text: string
  has_membership_fee: boolean
  membership_fee_text: string
  application_url: string
  application_process: string
  full_recruitment_text: string | null
  image_urls: string[]
}

export type RecruitmentDetail = {
  id: number
  display_title: string
  club_id: string
  content: RecruitmentContent
}

type ListClubRecruitmentsApiResponse = {
  success: boolean
  message: string
  data: ListClubRecruitmentsResponse
}

type RepresentativeRecruitmentApiPayload = {
  id: number | string
  updatedAt: string
}

type GetRepresentativeRecruitmentApiResponse =
  | RepresentativeRecruitmentApiPayload
  | { success: boolean; message: string; data: RepresentativeRecruitmentApiPayload | null }
  | null

type GetRecruitmentDetailApiResponse = {
  success: boolean
  data: RecruitmentDetail
}

// ─── fetch helpers ──────────────────────────────────────────────────────────

// 앱 apiConnector 인터셉터와 동일: 로그인 시 Bearer 토큰, 비로그인 시 x-guest-id
function identityHeaders(): Record<string, string> {
  const auth = authHeaders()
  return Object.keys(auth).length > 0 ? auth : { 'x-guest-id': getGuestId() }
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: identityHeaders() })
  if (!res.ok) {
    throw new Error(`${url} failed: ${res.status}`)
  }
  return res.json()
}

// ─── Recruitment ────────────────────────────────────────────────────────────

/** 앱 recruitmentRepository.getRepresentativeRecruitment 와 동일한 응답 정규화 */
export async function fetchRepresentativeRecruitment(
  clubId: string,
): Promise<RepresentativeRecruitment> {
  const res = await fetchJson<GetRepresentativeRecruitmentApiResponse>(
    `/api/v2/clubs/${clubId}/recruitments/representative`,
  )
  const representative = res && 'data' in res ? res.data : res
  if (!representative) return null

  const id = Number(representative.id)
  return Number.isNaN(id) ? null : { id, updatedAt: representative.updatedAt }
}

export function useRepresentativeRecruitment(clubId: string | undefined, enabled = true) {
  return useQuery(
    ['representativeRecruitment', clubId],
    () => fetchRepresentativeRecruitment(clubId as string),
    { enabled: !!clubId && enabled },
  )
}

export async function fetchRecruitmentDetail(recruitmentId: number): Promise<RecruitmentDetail> {
  const res = await fetchJson<GetRecruitmentDetailApiResponse>(
    `/api/v2/recruitments/${recruitmentId}`,
  )
  return res.data
}

export function useRecruitmentDetail(recruitmentId: number | null, enabled = true) {
  return useQuery(
    ['recruitmentDetail', recruitmentId],
    () => fetchRecruitmentDetail(recruitmentId as number),
    { enabled: recruitmentId !== null && enabled },
  )
}

export async function fetchClubRecruitments(clubId: string): Promise<ListClubRecruitmentsResponse> {
  const res = await fetchJson<ListClubRecruitmentsApiResponse>(
    `/api/v2/clubs/${clubId}/recruitments`,
  )
  return { club_name: res.data.club_name, recruitments: res.data.recruitments }
}

export function useClubRecruitments(clubId: string | undefined, enabled = true) {
  return useQuery(['clubRecruitments', clubId], () => fetchClubRecruitments(clubId as string), {
    enabled: !!clubId && enabled,
  })
}

// ─── Review (앱 repositories/review.ts) ─────────────────────────────────────

export type MyClubReview = {
  reviewKeywordIds: string[]
  createdAt: string
  updatedAt: string
} | null

/** GET /v2/clubs/{uuid}/reviews/me — 내가 남긴 후기 키워드 (로그인 필요) */
export function useMyClubReview(uuid: Club['uuid'] | undefined, enabled = true) {
  return useQuery(
    ['myClubReview', uuid],
    () => authFetch<MyClubReview>(`/api/v2/clubs/${uuid}/reviews/me`),
    { enabled: !!uuid && enabled, select: (data) => data?.reviewKeywordIds },
  )
}

/** POST /v2/clubs/{uuid}/reviews — 후기 키워드 저장 */
export function useCreateClubReview(uuid: Club['uuid'] | undefined, onSuccess?: () => void) {
  const queryClient = useQueryClient()
  return useMutation(
    (reviewKeywordIds: string[]) =>
      authFetch<void>(`/api/v2/clubs/${uuid}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewKeywordIds }),
      }),
    {
      onSuccess: () => {
        // 앱과 동일: 전체 캐시 무효화 (동아리 상세의 리뷰 키워드/참여 수 갱신)
        queryClient.invalidateQueries()
        onSuccess?.()
      },
    },
  )
}
