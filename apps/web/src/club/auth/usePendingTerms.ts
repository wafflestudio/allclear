import { useMutation, useQuery, useQueryClient } from 'react-query'
import type { Terms as Term } from '../../../server/domain/model/Terms'
import { authFetch } from './token'

export type { Term }

export const TERMS_QUERY_KEY = ['terms'] as const

type Args = {
  isLoggedIn: boolean
  isProfileLoading: boolean
}

/**
 * 앱 shared/hooks/usePendingTerms 와 동일:
 * 로그인 상태에서만 미동의 약관을 조회하고,
 * shouldShowTermsModal = 프로필 로딩 중 null / 비로그인 false / 조회 완료 후 pending 여부.
 */
export function usePendingTerms({ isLoggedIn, isProfileLoading }: Args) {
  const queryClient = useQueryClient()
  const {
    data: pendingTerms = [],
    isFetched: hasFetchedPendingTerms,
    isError: hasPendingTermsError,
  } = useQuery(TERMS_QUERY_KEY, () => authFetch<{ data: Term[] }>('/api/v2/terms'), {
    enabled: !isProfileLoading && isLoggedIn,
    staleTime: 60 * 1000,
    retry: false,
    select: (res) => res.data,
  })

  const agreeTermsMutation = useMutation(
    ({ termUuids }: { termUuids: string[] }) =>
      authFetch<void>('/api/v2/terms/agree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ termUuids }),
      }),
    { onSuccess: () => queryClient.invalidateQueries(TERMS_QUERY_KEY) },
  )

  const shouldShowTermsModal: boolean | null = isProfileLoading
    ? null
    : !isLoggedIn
      ? false
      : hasFetchedPendingTerms || hasPendingTermsError
        ? pendingTerms.length > 0
        : null

  return {
    pendingTerms,
    isSubmitting: agreeTermsMutation.isLoading,
    shouldShowTermsModal,
    handleAgreeTerms: agreeTermsMutation.mutate,
  }
}
