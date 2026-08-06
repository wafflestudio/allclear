import { NextApiRequest, NextApiResponse } from 'next'
import { Provider } from 'server/provider'
import { ReviewServiceV1 } from 'server/service/v1/review.service'
import { UserServiceV1 } from 'server/service/v1/user.service'
import { z, ZodIssue } from 'zod'
import { UserNotFoundError } from 'server/domain/error'

type ResponseData = MyReview | null

export type MyReview = {
  rating: number
  reviewKeywordIds: string[]
  content: string
  createdAt: string
  updatedAt: string
}

const QueryValidator = z.object({
  uuid: z.string().uuid(),
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | string | ZodIssue[]>,
) {
  try {
    const userService = Provider.getService(UserServiceV1)
    const reviewService = Provider.getService(ReviewServiceV1)

    if (req.method == 'GET') {
      const { uuid: clubUuid } = QueryValidator.parse(req.query)
      const user = await userService.getUserByAccountId(req.headers.user as string)
      const myReview: MyReview | null = await reviewService.getMyReview(
        user.serviceUserId,
        clubUuid,
      )
      return res.status(200).send(myReview)
    }
  } catch (err) {
    if (err instanceof UserNotFoundError) {
      return res.status(404).send('user not found')
    }
    if (err instanceof z.ZodError) {
      return res.status(400).json(err.errors)
    }
    console.error('myClubReviews error: ', err)
    return res.status(500).send('Internal Server Error')
  }
}
