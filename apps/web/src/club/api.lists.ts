import { useMutation } from 'react-query'
import type { Club, ClubListResponse } from './api'

// --- 앱 shared/utils/club.ts 미러 (목록 카드/미리보기 카드의 요약 문구) ---

type ClubAffiliation = Pick<Club, 'affiliationType' | 'collegeMajor'>
type ClubSummary = Pick<Club, 'description' | 'shortDescription'>

export const getClubAffiliationLabel = (club: ClubAffiliation): string => {
  if (club.affiliationType === '소속동아리') {
    return club.collegeMajor?.major || club.collegeMajor?.college || '기타'
  }

  return club.affiliationType || '기타'
}

// 미리보기 카드(홈 최신 공고, 랜덤 추천) 설명: 한줄 소개 → 없으면 설명
export const getClubSummary = (club: ClubSummary): string =>
  club.shortDescription?.trim() || club.description?.trim() || ''

// 목록 카드 설명: "{소속} 소속 {한줄 소개}" (소속이 '기타'면 한줄 소개만)
export const getClubSummaryWithAffiliation = (club: ClubAffiliation & ClubSummary): string => {
  const shortDescription = club.shortDescription?.trim()
  if (!shortDescription) {
    return club.description?.trim() || ''
  }

  const affiliation = getClubAffiliationLabel(club)
  if (affiliation === '기타') {
    return shortDescription
  }

  return `${affiliation} 소속 ${shortDescription}`
}

// --- 랜덤 추천 (앱 SearchScreen useRandomRecommendations) ---
// 앱은 useMutation으로 검색 결과가 0건이 될 때마다(검색어/필터 변경, 재검색) 새로 요청한다.
export function useRandomRecommendationsMutation() {
  return useMutation<ClubListResponse>(async () => {
    const url = '/api/v2/clubs/recommendations/random'
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`${url} failed: ${res.status}`)
    }
    return res.json()
  })
}
