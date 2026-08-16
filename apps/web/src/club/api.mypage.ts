import { useMutation, useQuery, useQueryClient } from 'react-query'
import type {
  ManagedClubListItem,
  ManagedClubManagementStatus,
} from '../../server/domain/model/Club'
import type { CollegeMajor } from '../../server/domain/model/CollegeMajor'
import type { UserNotification } from '../../server/domain/model/UserNotification'
import { authFetch } from './auth/token'

// 마이페이지 영역(앱 MyPageScreen / EditProfileScreen / UserVoiceView)이 쓰는 API 훅.
// 앱 repositories/{club,user,auth}.ts 와 같은 엔드포인트를 same-origin /api/v2 로 호출한다.

export type { CollegeMajor, ManagedClubListItem, ManagedClubManagementStatus, UserNotification }
export type UserNotificationType = UserNotification['type']

export const MANAGE_CLUBS_QUERY_KEY = ['manageClubs'] as const
export const USER_NOTIFICATIONS_QUERY_KEY = ['userNotifications'] as const
export const COLLEGE_MAJORS_QUERY_KEY = ['collegeMajors'] as const

// --- 관리 중인 동아리 (앱 clubService.listManageClubs) ---

type ListManageClubsV2Response = {
  success: boolean
  message: string
  data: {
    total_count: number
    clubs: (Omit<ManagedClubListItem, 'hasManager'> & { hasManager?: boolean })[]
  }
}

export type ListManageClubsResponse = {
  clubs: ManagedClubListItem[]
  totalSize: number
}

export async function fetchManageClubs(): Promise<ListManageClubsResponse> {
  const response = await authFetch<ListManageClubsV2Response>('/api/v2/managers/me/clubs')
  return {
    clubs: response.data.clubs.map((club) => ({
      ...club,
      hasManager: club.hasManager ?? false,
    })),
    totalSize: response.data.total_count,
  }
}

export function useManageClubs(enabled: boolean) {
  return useQuery(MANAGE_CLUBS_QUERY_KEY, fetchManageClubs, {
    enabled,
    select: (data) => data.clubs,
  })
}

export const isRejectedRequest = (club: Pick<ManagedClubListItem, 'managementStatus'>) =>
  club.managementStatus === 'REJECTED' || club.managementStatus === 'MANAGER_REQUEST_REJECTED'

/**
 * 앱 MyPageScreen cancelRequestMutation과 동일:
 * PENDING/REJECTED(동아리 등록 신청) → DELETE /managers/me/clubs/{uuid}
 * MANAGER_REQUEST_*(운영진 권한 신청) → DELETE /clubs/{uuid}/manager-requests
 * 성공 시 manageClubs 무효화. 화면 상태(모달 닫기/성공 모달)는 호출부의 mutate 콜백에서 처리한다.
 */
export function useCancelManagedClubRequest() {
  const queryClient = useQueryClient()
  return useMutation<void, unknown, ManagedClubListItem>(
    async (club) => {
      if (club.managementStatus === 'PENDING' || club.managementStatus === 'REJECTED') {
        await authFetch<void>(`/api/v2/managers/me/clubs/${club.uuid}`, { method: 'DELETE' })
        return
      }
      await authFetch<void>(`/api/v2/clubs/${club.uuid}/manager-requests`, { method: 'DELETE' })
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(MANAGE_CLUBS_QUERY_KEY)
      },
    },
  )
}

// --- 사용자 알림 (앱 userService.listNotifications / readNotification) ---

export type ListUserNotificationsResponse = {
  notifications: UserNotification[]
  totalSize: number
  unreadCount: number
}

export function useUserNotifications(enabled: boolean) {
  return useQuery(
    USER_NOTIFICATIONS_QUERY_KEY,
    () => authFetch<ListUserNotificationsResponse>('/api/v2/users/me/notifications'),
    { enabled },
  )
}

export function useReadNotification() {
  const queryClient = useQueryClient()
  return useMutation<void, unknown, UserNotification['id']>(
    (notificationId) =>
      authFetch<void>(`/api/v2/users/me/notifications/${notificationId}/read`, {
        method: 'PATCH',
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(USER_NOTIFICATIONS_QUERY_KEY)
      },
    },
  )
}

// --- 의견 보내기 (앱 userService.createUserVoice) ---

export function useCreateUserVoice() {
  return useMutation<void, unknown, string>((content) =>
    authFetch<void>('/api/v2/users/me/voices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    }),
  )
}

// --- 단과대/학과 (앱 userService.listCollegeMajors) ---

type ListCollegeMajorsResponse = {
  majors: CollegeMajor[]
  totalSize: number
}

export function useCollegeMajors() {
  return useQuery(
    COLLEGE_MAJORS_QUERY_KEY,
    () => authFetch<ListCollegeMajorsResponse>('/api/v2/users/majors'),
    { keepPreviousData: true, select: (data) => data.majors },
  )
}

// --- 프로필 수정 (앱 userService.updateUser) ---

export type UpdateUserRequest = {
  nickname?: string
  name?: string
  email?: string
  collegeMajorId?: number | null
  admissionClass?: number | null
}

export function updateUser(request: UpdateUserRequest) {
  return authFetch<void>('/api/v2/users/me', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
}

// --- 회원 탈퇴 (앱 authService.leave) ---

export function leaveAccount() {
  return authFetch<void>('/api/v2/auth/leave', { method: 'POST' })
}
