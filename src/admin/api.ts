import type {
  AdminClubsResponse,
  AdminClubDetailResponse,
  AdminClubManagerRequestsResponse,
  AdminClubVerificationRequestsResponse,
  AdminClubHistoriesResponse,
} from 'src/lib/schemas/admin'
import { ADMIN_AUTH_TOKEN_KEY, buildQuery } from 'src/admin/constants'
import type { ClubStatus, StatusFilter } from 'src/admin/types'
import type { ClubCollegeMajor } from 'src/entities/club'

type FetchOptions = NonNullable<Parameters<typeof fetch>[1]>
type PaginationParams = {
  offset?: number
  limit?: number
}
type CollegeMajorsResponse = {
  majors: ClubCollegeMajor[]
  totalSize: number
}

export const request = async <T>(url: string, init?: FetchOptions): Promise<T> => {
  const token =
    typeof window === 'undefined' ? null : window.localStorage.getItem(ADMIN_AUTH_TOKEN_KEY)
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed with ${response.status}`)
  }

  return response.json() as Promise<T>
}

export const verifyAdminRole = async (token: string): Promise<void> => {
  const res = await fetch('/api/v2/admin/me', {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error('admin role required')
}

export const fetchClubs = (status: StatusFilter, pagination: PaginationParams = {}) =>
  request<AdminClubsResponse>(
    `/api/v2/admin/clubs${buildQuery({
      status: status === 'ALL' ? undefined : status,
      ...pagination,
    })}`,
  )

export const fetchClubDetail = (uuid: string) =>
  request<AdminClubDetailResponse>(`/api/v2/admin/clubs/${uuid}`)

export const fetchManagerRequests = (status: StatusFilter, pagination: PaginationParams = {}) =>
  request<AdminClubManagerRequestsResponse>(
    `/api/v2/admin/clubs/manager-requests${buildQuery({
      status: status === 'ALL' ? undefined : status,
      ...pagination,
    })}`,
  )

export const fetchVerificationRequests = (
  status: StatusFilter,
  pagination: PaginationParams = {},
) =>
  request<AdminClubVerificationRequestsResponse>(
    `/api/v2/admin/clubs/verifications${buildQuery({
      status: status === 'ALL' ? undefined : status,
      ...pagination,
    })}`,
  )

export const fetchHistories = (query: string, pagination: PaginationParams = {}) =>
  request<AdminClubHistoriesResponse>(
    `/api/v2/admin/clubs/histories${buildQuery({ query, ...pagination })}`,
  )

export const fetchCollegeMajors = async () => {
  const response = await request<CollegeMajorsResponse>(
    `/api/v2/users/majors${buildQuery({ includeNullMajor: 'true' })}`,
  )
  return response.majors
}

export const updateClubStatus = (payload: {
  uuid: string
  status: ClubStatus
  reject_reason?: string
  is_official_verified: boolean
}) =>
  request(`/api/v2/admin/clubs/${payload.uuid}/status`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: payload.status,
      reject_reason: payload.reject_reason,
      is_official_verified: payload.is_official_verified,
    }),
  })

export const updateManagerRequestStatus = (payload: {
  id: number
  status: ClubStatus
  reject_reason?: string
}) =>
  request(`/api/v2/admin/clubs/manager-requests/${payload.id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: payload.status,
      reject_reason: payload.reject_reason,
    }),
  })

export const updateVerificationStatus = (payload: {
  id: number
  status: ClubStatus
  reject_reason?: string
}) =>
  request(`/api/v2/admin/clubs/verifications/${payload.id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: payload.status,
      reject_reason: payload.reject_reason,
    }),
  })
