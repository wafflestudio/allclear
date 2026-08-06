import { NextApiRequest, NextApiResponse } from 'next'
import { Provider } from 'server/provider'
import { ReviewServiceV1 } from 'server/service/v1/review.service'
import { UserServiceV1 } from 'server/service/v1/user.service'
import { z } from 'zod'
import { UserNotFoundError } from 'server/domain/error'

const UpdateClubReviewValidator = z.object({
  rating: z.number().min(0).max(5).optional(),
  reviewKeywordIds: z.array(z.string().uuid()).optional(),
  content: z.string().trim().nonempty().max(100).optional(),
})
const QueryValidator = z.object({
  uuid: z.string().uuid(),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const userService = Provider.getService(UserServiceV1)
    const reviewService = Provider.getService(ReviewServiceV1)

    if (req.method == 'POST') {
      const { uuid: clubUuid } = QueryValidator.parse(req.query)
      const user = await userService.getUserByAccountId(req.headers.user as string)
      const body = UpdateClubReviewValidator.parse(req.body)
      await reviewService.reviewClub(user.serviceUserId, clubUuid, body)
      return res.status(204).send(null)
    }
  } catch (err) {
    if (err instanceof UserNotFoundError) {
      return res.status(404).send('user not found')
    }
    if (err instanceof z.ZodError) {
      return res.status(400).json(err.errors)
    }
    console.error('reviewClub error: ', err)
    return res.status(500).send('Internal Server Error')
  }
}
