import { NextApiRequest, NextApiResponse } from 'next'
import { Provider } from 'server/provider'
import { ReviewServiceV1 } from 'server/service/v1/review.service'
import { z } from 'zod'

const QueryValidator = z.object({
  topk: z
    .preprocess((d) => parseInt(d as string, 10), z.number().int().positive().min(1).max(20))
    .optional(),
})

type ResponseData = {
  rankings: ClubRanking[]
  totalSize: number
}

export type ClubRanking = {
  // 1, 2, 3, ...
  ranking: number
  clubId: string
  clubName: string
  clubFullName: string
  totalReviews: number
  rating: number
  // top 3
  keywords: string[]
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | string>,
) {
  try {
    const reviewService = Provider.getService(ReviewServiceV1)

    if (req.method == 'GET') {
      const { topk } = QueryValidator.parse(req.query)
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
