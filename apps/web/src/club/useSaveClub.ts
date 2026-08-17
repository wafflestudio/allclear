import { useCallback, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import { toast } from 'react-toastify'
import type { Club, ClubListResponse } from './api'
import { useProfile, useRequireLogin } from './auth/AuthContext'
import { authFetch } from './auth/token'

const SAVE_DEBOUNCE_MS = 300

export function useSavedClubs() {
  const { user } = useProfile()
  return useQuery(
    ['savedClubs'],
    () => authFetch<ClubListResponse>('/api/v2/users/me/clubs/saved'),
    { enabled: !!user, staleTime: Infinity },
  )
}

/**
 * 앱 useSaveClub과 동일: 낙관적 캐시 갱신 → 300ms 디바운스 후 API,
 * 서버 상태와 같아지면 skip, 실패 시 롤백 + 토스트.
 */
export function useSaveClub(club: Pick<Club, 'uuid'> & Partial<Club>) {
  const queryClient = useQueryClient()
  const requireLogin = useRequireLogin()
  const { user } = useProfile()
  const { data: savedData } = useSavedClubs()

  const isSaved = !!savedData?.clubs.some((c) => c.uuid === club.uuid)

  const serverSavedRef = useRef(isSaved)
  const desiredRef = useRef(isSaved)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (!timerRef.current) {
      serverSavedRef.current = isSaved
      desiredRef.current = isSaved
    }
  }, [isSaved])

  const updateCache = useCallback(
    (next: boolean) => {
      queryClient.setQueryData<ClubListResponse | undefined>(['savedClubs'], (prev) => {
        if (!prev) return prev
        if (next) {
          if (prev.clubs.some((c) => c.uuid === club.uuid)) return prev
          return { clubs: [club as Club, ...prev.clubs], totalSize: prev.totalSize + 1 }
        }
        return {
          clubs: prev.clubs.filter((c) => c.uuid !== club.uuid),
          totalSize: Math.max(prev.totalSize - 1, 0),
        }
      })
    },
    [queryClient, club],
  )

  const flush = useCallback(async () => {
    timerRef.current = undefined
    const desired = desiredRef.current
    if (desired === serverSavedRef.current) return
    try {
      await authFetch<void>(`/api/v2/clubs/${club.uuid}/saved`, {
        method: desired ? 'POST' : 'DELETE',
      })
      serverSavedRef.current = desired
    } catch {
      desiredRef.current = serverSavedRef.current
      updateCache(serverSavedRef.current)
      toast.error('저장에 실패했어요.')
    }
  }, [club.uuid, updateCache])

  const toggle = useCallback(() => {
    if (!user) {
      // 앱과 동일: 로그인 시트만 열고 로그인 후 자동 저장은 하지 않음
      requireLogin(() => {})
      return
    }
    const next = !desiredRef.current
    desiredRef.current = next
    updateCache(next)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => void flush(), SAVE_DEBOUNCE_MS)
  }, [user, requireLogin, updateCache, flush])

  // 언마운트 시 대기 중인 변경을 즉시 반영 (앱과 동일)
  useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        void flush()
      }
    },
    [flush],
  )

  return { isSaved, toggle }
}
