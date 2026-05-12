import { NextApiRequest, NextApiResponse } from 'next'
import { Provider } from 'server/provider'
import { SearchService } from 'server/service/search.service'
import { Club } from 'server/domain/model/Club'

type ResponseData = {
  clubs: Club[]
  totalSize: number
  query: string
  correctedQuery: string | null
  isTypoCorrected: boolean
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | string>,
) {
  try {
    const searchService = Provider.getService(SearchService)

    if (req.method == 'GET') {
      const query = req.query.query as string
      if (!query) {
        return res.status(400).send('query is required')
      }
      const { clubs, correctedQuery, isTypoCorrected } =
        await searchService.searchWithTypoCorrection(query)
      return res.status(200).json({
        clubs: clubs,
        totalSize: clubs.length,
        query,
        correctedQuery,
        isTypoCorrected,
      })
    }
  } catch (err) {
    console.error('searchClubs error: ', err)
    return res.status(500).send('Internal Server Error')
  }
}
