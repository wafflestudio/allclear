import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import type { Announcement } from '../../../server/domain/model/Announcement'
import { getGuestId } from '../guestId'
import { ApiError, authFetch, authHeaders } from './token'

export type AnnouncementModalItem = {
  key: string
  uuid: string
  title: string
  description: string
}

const ANNOUNCEMENTS_QUERY_KEY = ['announcements'] as const
// 앱의 hasShownAnnouncementsThisSession(모듈 변수) 대응 — 웹은 OAuth 리다이렉트로 페이지가
// 새로 로드되므로 탭 세션 스토리지에 기록해 "세션당 1회"를 유지한다.
const SHOWN_SESSION_KEY = 'allclear-announcements-shown'

const hasShownThisSession = () => {
  try {
    return window.sessionStorage.getItem(SHOWN_SESSION_KEY) === 'true'
  } catch {
    return false
  }
}

const markShownThisSession = () => {
  try {
    window.sessionStorage.setItem(SHOWN_SESSION_KEY, 'true')
  } catch {
    // 스토리지가 막힌 환경에서는 그냥 넘어간다
  }
}

// 앱 apiConnector 인터셉터와 동일: 로그인 시 Bearer, 비로그인 시 x-guest-id
async function fetchAnnouncements(): Promise<{ data: Announcement[] }> {
  const auth = authHeaders()
  const headers = Object.keys(auth).length > 0 ? auth : { 'x-guest-id': getGuestId() }
  const url = '/api/v2/announcements'
  const res = await fetch(url, { headers })
  if (!res.ok) throw new ApiError(url, res.status)
  return res.json()
}

/**
 * 앱 shared/hooks/useAnnouncementModals 와 동일:
 * 공지 목록을 세션당 한 번 큐에 담아 하나씩 보여주고, "다시 보지 않기"면 dismiss API 호출.
 */
export function useAnnouncementModals() {
  const queryClient = useQueryClient()
  const [modalQueue, setModalQueue] = useState<AnnouncementModalItem[]>([])
  const { data: announcements = [], isSuccess: hasLoadedAnnouncements } = useQuery(
    ANNOUNCEMENTS_QUERY_KEY,
    fetchAnnouncements,
    { staleTime: 60 * 1000, select: (res) => res.data },
  )
  const dismissAnnouncementsMutation = useMutation(
    (announcementUuids: string[]) =>
      authFetch<void>('/api/v2/announcements/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcementUuids }),
      }),
    { onSuccess: () => queryClient.invalidateQueries(ANNOUNCEMENTS_QUERY_KEY) },
  )

  useEffect(() => {
    if (!hasLoadedAnnouncements) return
    if (hasShownThisSession()) return

    setModalQueue(
      announcements.map((announcement) => ({
        key: `announcement-${announcement.uuid}`,
        uuid: announcement.uuid,
        title: announcement.title,
        description: announcement.content,
      })),
    )
    markShownThisSession()
  }, [announcements, hasLoadedAnnouncements])

  const handleCloseAnnouncement = () => {
    setModalQueue((prev) => prev.slice(1))
  }

  const handleHideAnnouncement = () => {
    const currentAnnouncement = modalQueue[0]
    if (!currentAnnouncement) return

    dismissAnnouncementsMutation.mutate([currentAnnouncement.uuid])
    setModalQueue((prev) => prev.slice(1))
  }

  return {
    currentAnnouncement: modalQueue[0],
    handleCloseAnnouncement,
    handleHideAnnouncement,
  }
}
