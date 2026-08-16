// 앱 repositories/club.ts 의 관리 동아리(managers/me) 부분 대응
import { useMutation, useQuery, useQueryClient } from 'react-query'
import type {
  ManagedClubListItem,
  ManagedClubManagementStatus,
} from '../../../server/domain/model/Club'
import { authFetch } from '../auth/token'

export type { ManagedClubListItem, ManagedClubManagementStatus }

export const MANAGE_CLUBS_QUERY_KEY = ['manageClubs'] as const

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
