import { Service } from 'server/provider'
import { Club } from 'server/domain/model/Club'
import { SearchSortType } from './search.types'

@Service
export class SearchSortService {
  sort<T extends Club>(clubs: T[], query: string, sort: SearchSortType = 'default'): T[] {
    switch (sort) {
      case 'default':
        return sortByOfficialVerifiedAndNameMatch([...clubs], query)
    }
  }
}

function sortByOfficialVerifiedAndNameMatch<T extends Club>(clubs: T[], query: string): T[] {
  // query 정규화와 클럽별 일치 점수를 한 번씩만 계산한다(decorate-sort).
  const normalizedQuery = query.trim().toLowerCase()
  const decorated = clubs.map((club) => ({
    club,
    score: nameMatchScore(club.name, normalizedQuery),
  }))

  decorated.sort((a, b) => {
    if (a.club.isOfficialVerified !== b.club.isOfficialVerified) {
      return a.club.isOfficialVerified ? -1 : 1
    }
    // 동일한 인증 상태 내에서는 query와의 일치 정도가 높은(점수가 낮은) 순으로 정렬한다.
    if (a.score !== b.score) {
      return a.score - b.score
    }
    // 일치 정도가 같으면 이름이 짧을수록(query에 더 가까울수록) 우선한다.
    if (a.club.name.length !== b.club.name.length) {
      return a.club.name.length - b.club.name.length
    }
    return a.club.name.localeCompare(b.club.name, 'ko')
  })

  return decorated.map((it) => it.club)
}

// 값이 작을수록 query와 더 잘 일치한다. normalizedQuery는 미리 정규화된 값을 받는다.
function nameMatchScore(name: string, normalizedQuery: string): number {
  if (!normalizedQuery) {
    return Number.MAX_SAFE_INTEGER
  }
  const normalizedName = name.trim().toLowerCase()
  if (normalizedName === normalizedQuery) {
    return 0
  }
  if (normalizedName.startsWith(normalizedQuery)) {
    return 1
  }
  const matchIndex = normalizedName.indexOf(normalizedQuery)
  if (matchIndex >= 0) {
    // query가 이름의 앞쪽에서 매칭될수록 우선한다.
    return 100 + matchIndex
  }
  // 이름에 query가 포함되지 않는 경우(전공/학과 매칭 등)는 가장 뒤로 보낸다.
  return Number.MAX_SAFE_INTEGER
}
