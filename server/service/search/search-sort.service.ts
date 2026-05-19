import { Service } from 'server/provider'
import { Club } from 'server/domain/model/Club'
import { SearchSortType } from './search.types'

@Service
export class SearchSortService {
  sort(clubs: Club[], sort: SearchSortType = 'default'): Club[] {
    switch (sort) {
      case 'default':
        return sortByOfficialVerifiedAndRandom([...clubs])
    }
  }
}

function sortByOfficialVerifiedAndRandom(clubs: Club[]): Club[] {
  return clubs.sort((a, b) => {
    if (a.isOfficialVerified && !b.isOfficialVerified) {
      return -1
    }
    if (!a.isOfficialVerified && b.isOfficialVerified) {
      return 1
    }
    return Math.random() - 0.5
  })
}
