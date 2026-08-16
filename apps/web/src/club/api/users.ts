// 앱 repositories/user.ts, auth.ts 대응 — 알림 / 문의 / 단과대·학과 / 프로필 수정 / 탈퇴
import { useMutation, useQuery, useQueryClient } from 'react-query'
import type { CollegeMajor } from '../../../server/domain/model/CollegeMajor'
import type { UserNotification } from '../../../server/domain/model/UserNotification'
import { authFetch } from '../auth/token'

export type { CollegeMajor, UserNotification }
export type UserNotificationType = UserNotification['type']

export const USER_NOTIFICATIONS_QUERY_KEY = ['userNotifications'] as const
export const COLLEGE_MAJORS_QUERY_KEY = ['collegeMajors'] as const

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
