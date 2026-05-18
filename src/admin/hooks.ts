import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import {
  fetchClubDetail,
  fetchClubs,
  fetchHistories,
  fetchManagerRequests,
  fetchVerificationRequests,
  updateClubStatus,
  updateManagerRequestStatus,
  updateVerificationStatus,
} from 'src/admin/api'
import { ADMIN_AUTH_TOKEN_KEY } from 'src/admin/constants'
import type { AdminTab, DecisionStatus, StatusFilter } from 'src/admin/types'

export const useAdminDashboard = () => {
  const queryClient = useQueryClient()
  const [authReady, setAuthReady] = useState(false)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<AdminTab>('clubs')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('PENDING')
  const [submittedHistoryQuery, setSubmittedHistoryQuery] = useState('')

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
  const historiesQuery = useQuery(
    ['admin-club-histories', submittedHistoryQuery],
    () => fetchHistories(submittedHistoryQuery),
    { enabled: activeTab === 'histories' && !!authToken },
  )

  const clubStatusMutation = useMutation(updateClubStatus, {
    onSuccess: () => {
      queryClient.invalidateQueries('admin-clubs')
      queryClient.invalidateQueries('admin-club-detail')
    },
  })
  const managerRequestMutation = useMutation(updateManagerRequestStatus, {
    onSuccess: () => queryClient.invalidateQueries('admin-manager-requests'),
  })
  const verificationMutation = useMutation(updateVerificationStatus, {
    onSuccess: () => queryClient.invalidateQueries('admin-verification-requests'),
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

  const handleLogin = (token: string) => {
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
    status: DecisionStatus
    reject_reason?: string
    is_official_verified: boolean
  }) => clubStatusMutation.mutate(payload)

  const handleManagerDecide = (payload: {
    id: number
    status: DecisionStatus
    reject_reason?: string
  }) => managerRequestMutation.mutate(payload)

  const handleVerificationDecide = (payload: {
    id: number
    status: DecisionStatus
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
      onSearch: setSubmittedHistoryQuery,
    },
  }
}

export const useClubDetail = (uuid: string | null) => {
  return useQuery(['admin-club-detail', uuid], () => fetchClubDetail(uuid ?? ''), {
    enabled: !!uuid,
  })
}
