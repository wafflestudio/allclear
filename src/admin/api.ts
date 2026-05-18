import type {
  AdminClubsResponse,
  AdminClubDetailResponse,
  AdminClubManagerRequestsResponse,
  AdminClubVerificationRequestsResponse,
  AdminClubHistoriesResponse,
} from 'src/lib/schemas/admin'
import { ADMIN_AUTH_TOKEN_KEY, buildQuery } from 'src/admin/constants'
import type { DecisionStatus, StatusFilter } from 'src/admin/types'

type FetchOptions = NonNullable<Parameters<typeof fetch>[1]>

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

export const fetchClubs = (status: StatusFilter) =>
  request<AdminClubsResponse>(
    `/api/v1/admin/clubs${buildQuery({ status: status === 'ALL' ? undefined : status })}`,
  )

export const fetchClubDetail = (uuid: string) =>
  request<AdminClubDetailResponse>(`/api/v1/admin/clubs/${uuid}`)

export const fetchManagerRequests = (status: StatusFilter) =>
  request<AdminClubManagerRequestsResponse>(
    `/api/v1/admin/clubs/manager-requests${buildQuery({
      status: status === 'ALL' ? undefined : status,
    })}`,
  )

export const fetchVerificationRequests = (status: StatusFilter) =>
  request<AdminClubVerificationRequestsResponse>(
    `/api/v1/admin/clubs/verifications${buildQuery({
      status: status === 'ALL' ? undefined : status,
    })}`,
  )

export const fetchHistories = (query: string) =>
  request<AdminClubHistoriesResponse>(
    `/api/v1/admin/clubs/histories${buildQuery({ query, limit: 30 })}`,
  )

export const updateClubStatus = (payload: {
  uuid: string
  status: DecisionStatus
  reject_reason?: string
  is_official_verified: boolean
}) =>
  request(`/api/v1/admin/clubs/${payload.uuid}/status`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: payload.status,
      reject_reason: payload.reject_reason,
      is_official_verified: payload.is_official_verified,
    }),
  })

export const updateManagerRequestStatus = (payload: {
  id: number
  status: DecisionStatus
  reject_reason?: string
}) =>
  request(`/api/v1/admin/clubs/manager-requests/${payload.id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: payload.status,
      reject_reason: payload.reject_reason,
    }),
  })

export const updateVerificationStatus = (payload: {
  id: number
  status: DecisionStatus
  reject_reason?: string
}) =>
  request(`/api/v1/admin/clubs/verifications/${payload.id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: payload.status,
      reject_reason: payload.reject_reason,
    }),
  })
