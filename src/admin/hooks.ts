import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import {
  fetchClubDetail,
  fetchCollegeMajors,
  fetchClubs,
  fetchHistories,
  fetchManagerRequests,
  fetchVerificationRequests,
  updateClubStatus,
  updateManagerRequestStatus,
  updateVerificationStatus,
  verifyAdminRole,
} from 'src/admin/api'
import { ADMIN_AUTH_TOKEN_KEY, formatCollegeMajorLabel } from 'src/admin/constants'
import type { AdminTab, ClubStatus, StatusFilter } from 'src/admin/types'

export const useAdminDashboard = () => {
  const queryClient = useQueryClient()
  const [authReady, setAuthReady] = useState(false)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<AdminTab>('clubs')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('PENDING')
  const [submittedHistoryQuery, setSubmittedHistoryQuery] = useState('')
  const [toasts, setToasts] = useState<
    { id: number; message: string; type: 'error' | 'success' }[]
  >([])

  const addError = (error: unknown) => {
    const message = error instanceof Error ? error.message : '오류가 발생했습니다.'
    setToasts((prev) => [...prev, { id: Date.now(), message, type: 'error' }])
  }

  const addSuccess = (message: string) => {
    setToasts((prev) => [...prev, { id: Date.now(), message, type: 'success' }])
  }

  const dismissToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  useEffect(() => {
    setAuthToken(window.localStorage.getItem(ADMIN_AUTH_TOKEN_KEY))
    setAuthReady(true)
  }, [])

  const clubsQuery = useQuery(['admin-clubs', statusFilter], () => fetchClubs(statusFilter), {
    enabled: activeTab === 'clubs' && !!authToken,
  })
  const managerRequestsQuery = useQuery(
    ['admin-manager-requests', statusFilter],
    () => fetchManagerRequests(statusFilter),
    { enabled: activeTab === 'managerRequests' && !!authToken },
  )
  const verificationRequestsQuery = useQuery(
    ['admin-verification-requests', statusFilter],
    () => fetchVerificationRequests(statusFilter),
    { enabled: activeTab === 'verificationRequests' && !!authToken },
  )

  const clubsPendingQuery = useQuery(['admin-clubs-pending-count'], () => fetchClubs('PENDING'), {
    enabled: !!authToken,
    refetchInterval: 30_000,
  })
  const managerRequestsPendingQuery = useQuery(
    ['admin-manager-requests-pending-count'],
    () => fetchManagerRequests('PENDING'),
    { enabled: !!authToken, refetchInterval: 30_000 },
  )
  const verificationsPendingQuery = useQuery(
    ['admin-verifications-pending-count'],
    () => fetchVerificationRequests('PENDING'),
    { enabled: !!authToken, refetchInterval: 30_000 },
  )
  const historiesQuery = useQuery(
    ['admin-club-histories', submittedHistoryQuery],
    () => fetchHistories(submittedHistoryQuery),
    { enabled: activeTab === 'histories' && !!authToken },
  )
  const collegeMajorsQuery = useQuery(['admin-college-majors'], fetchCollegeMajors, {
    enabled: activeTab === 'histories' && !!authToken,
    staleTime: 5 * 60 * 1000,
  })

  const STATUS_TEXT: Record<string, string> = {
    APPROVED: '승인',
    REJECTED: '반려',
    PENDING: '대기로 변경',
  }

  const clubStatusMutation = useMutation(updateClubStatus, {
    onSuccess: (_, variables) => {
      addSuccess(`${STATUS_TEXT[variables.status] ?? '처리'} 완료`)
      queryClient.invalidateQueries('admin-clubs')
      queryClient.invalidateQueries('admin-club-detail')
      queryClient.invalidateQueries('admin-clubs-pending-count')
    },
    onError: addError,
  })
  const managerRequestMutation = useMutation(updateManagerRequestStatus, {
    onSuccess: (_, variables) => {
      addSuccess(`${STATUS_TEXT[variables.status] ?? '처리'} 완료`)
      queryClient.invalidateQueries('admin-manager-requests')
      queryClient.invalidateQueries('admin-manager-requests-pending-count')
    },
    onError: addError,
  })
  const verificationMutation = useMutation(updateVerificationStatus, {
    onSuccess: (_, variables) => {
      addSuccess(`${STATUS_TEXT[variables.status] ?? '처리'} 완료`)
      queryClient.invalidateQueries('admin-verification-requests')
      queryClient.invalidateQueries('admin-verifications-pending-count')
    },
    onError: addError,
  })

  const totalCount = useMemo(() => {
    if (activeTab === 'clubs') return clubsQuery.data?.data.total_count ?? 0
    if (activeTab === 'managerRequests') return managerRequestsQuery.data?.data.total_count ?? 0
    if (activeTab === 'verificationRequests')
      return verificationRequestsQuery.data?.data.total_count ?? 0
    return historiesQuery.data?.data.total_count ?? 0
  }, [
    activeTab,
    clubsQuery.data,
    historiesQuery.data,
    managerRequestsQuery.data,
    verificationRequestsQuery.data,
  ])

  const collegeMajorLabels = useMemo(
    () =>
      (collegeMajorsQuery.data ?? []).reduce<Record<string, string>>((labels, collegeMajor) => {
        labels[String(collegeMajor.id)] = formatCollegeMajorLabel(collegeMajor)
        return labels
      }, {}),
    [collegeMajorsQuery.data],
  )

  const handleLogin = async (token: string) => {
    await verifyAdminRole(token)
    window.localStorage.setItem(ADMIN_AUTH_TOKEN_KEY, token)
    setAuthToken(token)
    queryClient.invalidateQueries()
  }

  const handleLogout = () => {
    window.localStorage.removeItem(ADMIN_AUTH_TOKEN_KEY)
    setAuthToken(null)
    queryClient.clear()
  }

  const handleClubDecide = (payload: {
    uuid: string
    status: ClubStatus
    reject_reason?: string
    is_official_verified: boolean
  }) => clubStatusMutation.mutate(payload)

  const handleManagerDecide = (payload: {
    id: number
    status: ClubStatus
    reject_reason?: string
  }) => managerRequestMutation.mutate(payload)

  const handleVerificationDecide = (payload: {
    id: number
    status: ClubStatus
    reject_reason?: string
  }) => verificationMutation.mutate(payload)

  return {
    authReady,
    authToken,
    activeTab,
    setActiveTab,
    statusFilter,
    setStatusFilter,
    totalCount,
    toasts,
    dismissToast,
    pendingCounts: {
      clubs: clubsPendingQuery.data?.data.total_count ?? 0,
      managerRequests: managerRequestsPendingQuery.data?.data.total_count ?? 0,
      verificationRequests: verificationsPendingQuery.data?.data.total_count ?? 0,
    },
    handleLogin,
    handleLogout,
    clubs: {
      data: clubsQuery.data?.data.clubs ?? [],
      isLoading: clubsQuery.isLoading,
      error: clubsQuery.error,
      onDecide: handleClubDecide,
      isMutating: clubStatusMutation.isLoading,
    },
    managerRequests: {
      data: managerRequestsQuery.data?.data.requests ?? [],
      isLoading: managerRequestsQuery.isLoading,
      error: managerRequestsQuery.error,
      onDecide: handleManagerDecide,
      isMutating: managerRequestMutation.isLoading,
    },
    verificationRequests: {
      data: verificationRequestsQuery.data?.data.requests ?? [],
      isLoading: verificationRequestsQuery.isLoading,
      error: verificationRequestsQuery.error,
      onDecide: handleVerificationDecide,
      isMutating: verificationMutation.isLoading,
    },
    histories: {
      data: historiesQuery.data?.data.histories ?? [],
      isLoading: historiesQuery.isLoading,
      error: historiesQuery.error,
      collegeMajorLabels,
      onSearch: setSubmittedHistoryQuery,
    },
  }
}

export const useClubDetail = (uuid: string | null) => {
  return useQuery(['admin-club-detail', uuid], () => fetchClubDetail(uuid ?? ''), {
    enabled: !!uuid,
  })
}
