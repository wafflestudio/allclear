// 앱 repositories/review.ts 대응 — 후기 키워드 목록
import { useQuery } from 'react-query'
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
