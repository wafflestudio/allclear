// 앱 repositories/review.ts 대응 — 후기 키워드 목록 / 내 후기 / 후기 저장
import { useMutation, useQuery, useQueryClient } from 'react-query'
import type { Club } from '../../../server/domain/model/Club'
import { authFetch } from '../auth/token'
import { fetchJson } from './client'

export type ReviewKeyword = {
  id: string
  title: string
  iconUri: string
}

export type ReviewKeywordCategory = {
  id: number
  title: string
  keywords: ReviewKeyword[]
}

export function useReviewKeywordCategories() {
  return useQuery(
    ['reviewKeywords'],
    () =>
      fetchJson<{ categories: ReviewKeywordCategory[]; totalSize: number }>(
        '/api/v2/clubs/reviews/keywords',
      ),
    { staleTime: Infinity, select: (data) => data.categories },
  )
}

// ─── Review (앱 repositories/review.ts) ─────────────────────────────────────

export type MyClubReview = {
  reviewKeywordIds: string[]
  createdAt: string
  updatedAt: string
} | null

/** GET /v2/clubs/{uuid}/reviews/me — 내가 남긴 후기 키워드 (로그인 필요) */
export function useMyClubReview(uuid: Club['uuid'] | undefined, enabled = true) {
  return useQuery(
    ['myClubReview', uuid],
    () => authFetch<MyClubReview>(`/api/v2/clubs/${uuid}/reviews/me`),
    { enabled: !!uuid && enabled, select: (data) => data?.reviewKeywordIds },
  )
}

/** POST /v2/clubs/{uuid}/reviews — 후기 키워드 저장 */
export function useCreateClubReview(uuid: Club['uuid'] | undefined, onSuccess?: () => void) {
  const queryClient = useQueryClient()
  return useMutation(
    (reviewKeywordIds: string[]) =>
      authFetch<void>(`/api/v2/clubs/${uuid}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewKeywordIds }),
      }),
    {
      onSuccess: () => {
        // 앱과 동일: 전체 캐시 무효화 (동아리 상세의 리뷰 키워드/참여 수 갱신)
        queryClient.invalidateQueries()
        onSuccess?.()
      },
    },
  )
}
