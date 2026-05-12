import { NextApiRequest, NextApiResponse } from 'next'
import { Provider } from 'server/provider'
import { ReviewService } from 'server/service/review.service'
import { ClubRankingsQuerySchema, type ClubRanking } from 'src/lib/schemas/clubs'

type ResponseData = {
  rankings: ClubRanking[]
  totalSize: number
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | string>,
) {
  try {
    const reviewService = Provider.getService(ReviewService)

    if (req.method == 'GET') {
      const { topk } = ClubRankingsQuerySchema.parse(req.query)
      const rankings = await reviewService.getClubRankings(topk)
      return res.status(200).json({
        rankings: rankings,
        totalSize: rankings.length,
      })
    }
  } catch (err) {
    console.error('listClubReviewKeywords error: ', err)
    return res.status(500).send('Internal Server Error')
  }
}
