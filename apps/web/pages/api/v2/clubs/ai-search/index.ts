import type { NextApiRequest } from 'next'
import { parseMinSimilarity, parseSearchRequest } from 'server/api/club-search.request'
import {
  type SearchApiResponse,
  sendError,
  sendMethodNotAllowed,
  sendSearchResult,
} from 'server/api/club-search.response'
import { Provider } from 'server/provider'
import { AiSearchQuotaService } from 'server/service/ai-search-quota.service'
import { saveRecentSearchBestEffort } from 'server/service/recent-search.service'
import { SearchService } from 'server/service/search.service'
import { resolveOptionalAuth } from 'server/util/optional-auth'

// 문장의 뜻으로 검색합니다. 회원만, 하루 한도 안에서만 쓸 수 있습니다.
export default async function handler(req: NextApiRequest, res: SearchApiResponse) {
  if (req.method !== 'GET') {
    return sendMethodNotAllowed(res)
  }

  try {
    const auth = await resolveOptionalAuth(req)
    const { query, filters, recordRecentSearch } = parseSearchRequest(req.query)
    const minSimilarity = parseMinSimilarity(req.query.min_similarity)

    if (auth.type !== 'member') {
      return res.status(401).send('unauthorized')
    }

    // 잘못된 요청은 위에서 이미 거절했으므로 한도에 세지 않습니다.
    await Provider.getService(AiSearchQuotaService).consume(auth.accountId)

    const searchService = Provider.getService(SearchService)
    const result = await searchService.searchWithAi(query, { filters, minSimilarity })

    if (recordRecentSearch) {
      await saveRecentSearchBestEffort(auth, query)
    }
    return sendSearchResult(res, query, result)
  } catch (err) {
    return sendError(res, err)
  }
}
