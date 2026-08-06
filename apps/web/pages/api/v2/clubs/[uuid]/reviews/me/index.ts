import { NextApiRequest, NextApiResponse } from 'next'
import { Provider } from 'server/provider'
import { ReviewService } from 'server/service/review.service'
import { UserService } from 'server/service/user.service'
import { z, ZodIssue } from 'zod'
import { NotFoundError, UserNotFoundError } from 'server/domain/error'
import { ClubUuidParamsSchema, type MyReview } from 'src/lib/schemas/clubs'

type ResponseData = MyReview | null

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | string | ZodIssue[]>,
) {
  try {
    const userService = Provider.getService(UserService)
    const reviewService = Provider.getService(ReviewService)

    if (req.method == 'GET') {
      const { uuid: clubUuid } = ClubUuidParamsSchema.parse(req.query)
      const user = await userService.getUserByAccountId(req.headers.user as string)
      const myReview: MyReview | null = await reviewService.getMyReview(
        user.serviceUserId,
        clubUuid,
      )
      return res.status(200).send(myReview)
    }
  } catch (err) {
    if (err instanceof NotFoundError) {
      return res.status(404).send('club not found')
    }
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
