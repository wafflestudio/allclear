// 앱 repositories/user.ts 의 최근 검색어 부분 대응 — 서버 /v2/users/me/recent-searches
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { ApiError } from '../auth/token'
import { fetchJson, identityHeaders } from './client'

export type RecentSearch = {
  query: string
  searchedAt: string
}

type RecentSearchesResponse = {
  recentSearches: RecentSearch[]
  totalSize: number
}

export const RECENT_SEARCHES_QUERY_KEY = ['recentSearches'] as const

export function useRecentSearches() {
  return useQuery(
    RECENT_SEARCHES_QUERY_KEY,
    () => fetchJson<RecentSearchesResponse>('/api/v2/users/me/recent-searches', identityHeaders()),
    { staleTime: 0, select: (data) => data.recentSearches.map((it) => it.query) },
  )
}

export function useClearRecentSearches() {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, void, { previous?: RecentSearchesResponse }>(
    async () => {
      const url = '/api/v2/users/me/recent-searches'
      const res = await fetch(url, { method: 'DELETE', headers: identityHeaders() })
      if (!res.ok) {
        throw new ApiError(url, res.status)
      }
    },
    {
      // 앱과 동일: 낙관적으로 비우고 실패 시 롤백
      onMutate: async () => {
        await queryClient.cancelQueries(RECENT_SEARCHES_QUERY_KEY)
        const previous = queryClient.getQueryData<RecentSearchesResponse>(RECENT_SEARCHES_QUERY_KEY)
        queryClient.setQueryData<RecentSearchesResponse>(RECENT_SEARCHES_QUERY_KEY, {
          recentSearches: [],
          totalSize: 0,
        })
        return { previous }
      },
      onError: (_error, _variables, context) => {
        if (context?.previous) {
          queryClient.setQueryData(RECENT_SEARCHES_QUERY_KEY, context.previous)
        }
      },
    },
  )
}
