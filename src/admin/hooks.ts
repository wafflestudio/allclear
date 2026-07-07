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
import { ADMIN_AUTH_TOKEN_KEY, ADMIN_PAGE_SIZE, formatCollegeMajorLabel } from 'src/admin/constants'
import type { AdminTab, ClubStatus, StatusFilter } from 'src/admin/types'

const INITIAL_PAGE_BY_TAB: Record<AdminTab, number> = {
  clubs: 1,
  managerRequests: 1,
  verificationRequests: 1,
  histories: 1,
}

const PENDING_COUNT_PAGINATION = {
  offset: 0,
  limit: 1,
}

const getPageOffset = (page: number) => (page - 1) * ADMIN_PAGE_SIZE

export const useAdminDashboard = () => {
  const queryClient = useQueryClient()
  const [authReady, setAuthReady] = useState(false)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<AdminTab>('clubs')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('PENDING')
  const [pageByTab, setPageByTab] = useState<Record<AdminTab, number>>(INITIAL_PAGE_BY_TAB)
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

  const setTabPage = (tab: AdminTab, page: number) => {
    const nextPage = Math.max(1, Math.floor(page))
    setPageByTab((prev) => (prev[tab] === nextPage ? prev : { ...prev, [tab]: nextPage }))
  }

  const clubsPage = pageByTab.clubs
  const managerRequestsPage = pageByTab.managerRequests
  const verificationRequestsPage = pageByTab.verificationRequests
  const historiesPage = pageByTab.histories

  const clubsQuery = useQuery(
    ['admin-clubs', statusFilter, clubsPage, ADMIN_PAGE_SIZE],
    () =>
      fetchClubs(statusFilter, {
        offset: getPageOffset(clubsPage),
        limit: ADMIN_PAGE_SIZE,
      }),
    {
      enabled: activeTab === 'clubs' && !!authToken,
    },
  )
  const managerRequestsQuery = useQuery(
    ['admin-manager-requests', statusFilter, managerRequestsPage, ADMIN_PAGE_SIZE],
    () =>
      fetchManagerRequests(statusFilter, {
        offset: getPageOffset(managerRequestsPage),
        limit: ADMIN_PAGE_SIZE,
      }),
    { enabled: activeTab === 'managerRequests' && !!authToken },
  )
  const verificationRequestsQuery = useQuery(
    ['admin-verification-requests', statusFilter, verificationRequestsPage, ADMIN_PAGE_SIZE],
    () =>
      fetchVerificationRequests(statusFilter, {
        offset: getPageOffset(verificationRequestsPage),
        limit: ADMIN_PAGE_SIZE,
      }),
    { enabled: activeTab === 'verificationRequests' && !!authToken },
  )

  const clubsPendingQuery = useQuery(
    ['admin-clubs-pending-count'],
    () => fetchClubs('PENDING', PENDING_COUNT_PAGINATION),
    {
      enabled: !!authToken,
      refetchInterval: 30_000,
    },
  )
  const managerRequestsPendingQuery = useQuery(
    ['admin-manager-requests-pending-count'],
    () => fetchManagerRequests('PENDING', PENDING_COUNT_PAGINATION),
    { enabled: !!authToken, refetchInterval: 30_000 },
  )
  const verificationsPendingQuery = useQuery(
    ['admin-verifications-pending-count'],
    () => fetchVerificationRequests('PENDING', PENDING_COUNT_PAGINATION),
    { enabled: !!authToken, refetchInterval: 30_000 },
  )
  const historiesQuery = useQuery(
    ['admin-club-histories', submittedHistoryQuery, historiesPage, ADMIN_PAGE_SIZE],
    () =>
      fetchHistories(submittedHistoryQuery, {
        offset: getPageOffset(historiesPage),
        limit: ADMIN_PAGE_SIZE,
      }),
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

  const activeTotalCount = useMemo(() => {
    if (activeTab === 'clubs') return clubsQuery.data?.data.total_count
    if (activeTab === 'managerRequests') return managerRequestsQuery.data?.data.total_count
    if (activeTab === 'verificationRequests')
      return verificationRequestsQuery.data?.data.total_count
    return historiesQuery.data?.data.total_count
  }, [
    activeTab,
    clubsQuery.data,
    historiesQuery.data,
    managerRequestsQuery.data,
    verificationRequestsQuery.data,
  ])

  const totalCount = activeTotalCount ?? 0
  const activeIsFetching =
    activeTab === 'clubs'
      ? clubsQuery.isFetching
      : activeTab === 'managerRequests'
      ? managerRequestsQuery.isFetching
      : activeTab === 'verificationRequests'
      ? verificationRequestsQuery.isFetching
      : historiesQuery.isFetching

  useEffect(() => {
    if (activeTotalCount === undefined) return

    const pageCount = Math.max(1, Math.ceil(activeTotalCount / ADMIN_PAGE_SIZE))
    setPageByTab((prev) =>
      prev[activeTab] > pageCount ? { ...prev, [activeTab]: pageCount } : prev,
    )
  }, [activeTab, activeTotalCount])

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

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab)
  }

  const handleStatusFilterChange = (status: StatusFilter) => {
    setStatusFilter(status)
    setPageByTab((prev) => ({
      ...prev,
      clubs: 1,
      managerRequests: 1,
      verificationRequests: 1,
    }))
  }

  const handleHistorySearch = (query: string) => {
    setSubmittedHistoryQuery(query)
    setTabPage('histories', 1)
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
    setActiveTab: handleTabChange,
    statusFilter,
    setStatusFilter: handleStatusFilterChange,
    totalCount,
    pagination: {
      page: pageByTab[activeTab],
      pageSize: ADMIN_PAGE_SIZE,
      totalCount,
      isFetching: activeIsFetching,
      onPageChange: (page: number) => setTabPage(activeTab, page),
    },
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
      onSearch: handleHistorySearch,
    },
  }
}

export const useClubDetail = (uuid: string | null) => {
  return useQuery(['admin-club-detail', uuid], () => fetchClubDetail(uuid ?? ''), {
    enabled: !!uuid,
  })
}
