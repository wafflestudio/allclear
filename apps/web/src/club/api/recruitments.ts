// 앱 repositories/recruitment.ts 대응 — 대표 모집공고 / 공고 상세 / 이전 공고 목록.
// 앱과 동일한 엔드포인트/파라미터/정규화 규칙.
import { useQuery } from 'react-query'
import { fetchJson, identityHeaders } from './client'

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

// ─── Recruitment ────────────────────────────────────────────────────────────

/** 앱 recruitmentRepository.getRepresentativeRecruitment 와 동일한 응답 정규화 */
export async function fetchRepresentativeRecruitment(
  clubId: string,
): Promise<RepresentativeRecruitment> {
  const res = await fetchJson<GetRepresentativeRecruitmentApiResponse>(
    `/api/v2/clubs/${clubId}/recruitments/representative`,
    identityHeaders(),
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
    identityHeaders(),
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
    identityHeaders(),
  )
  return { club_name: res.data.club_name, recruitments: res.data.recruitments }
}

export function useClubRecruitments(clubId: string | undefined, enabled = true) {
  return useQuery(['clubRecruitments', clubId], () => fetchClubRecruitments(clubId as string), {
    enabled: !!clubId && enabled,
  })
}
