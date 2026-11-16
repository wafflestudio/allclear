import type { NextApiRequest } from 'next'
import { parseSearchRequest } from 'server/api/club-search.request'
import {
  type SearchApiResponse,
  sendError,
  sendMethodNotAllowed,
  sendSearchResult,
} from 'server/api/club-search.response'
import { Provider } from 'server/provider'
import { saveRecentSearchBestEffort } from 'server/service/recent-search.service'
import { SearchService } from 'server/service/search.service'
import { resolveOptionalAuth } from 'server/util/optional-auth'

// 문자열 일치와 오타 교정으로 검색합니다. 회원과 비회원 모두 쓸 수 있습니다.
export default async function handler(req: NextApiRequest, res: SearchApiResponse) {
  if (req.method !== 'GET') {
    return sendMethodNotAllowed(res)
  }

  try {
    const auth = await resolveOptionalAuth(req)
    const { query, filters, recordRecentSearch } = parseSearchRequest(req.query)

    const searchService = Provider.getService(SearchService)
    const result = await searchService.searchWithTypoCorrection(query, { filters })

    if (recordRecentSearch) {
      await saveRecentSearchBestEffort(auth, query)
    }
    return sendSearchResult(res, query, result)
  } catch (err) {
    return sendError(res, err)
  }
}
