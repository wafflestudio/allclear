import { NextApiRequest, NextApiResponse } from 'next'
import { Provider } from 'server/provider'
import { ReviewService } from '../../../../../../server/service/review.service'

type ResponseData = {
  categories: ReviewKeywordCategory[]
  totalSize: number
}

export type ReviewKeywordCategory = {
  id: number
  title: string
  color: string
  keywords: ReviewKeyword[]
}

export type ReviewKeyword = {
  id: string
  title: string
  color: string
  iconUri: string
}
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | string>,
) {
  try {
    const reviewService = Provider.getService(ReviewService)

    if (req.method == 'GET') {
      const keywordCategories = await reviewService.getKeywords()
      return res.status(200).json({
        categories: keywordCategories,
        totalSize: keywordCategories.length,
      })
    }
  } catch (err) {
    console.error('listClubReviewKeywords error: ', err)
    return res.status(500).send('Internal Server Error')
  }
}
