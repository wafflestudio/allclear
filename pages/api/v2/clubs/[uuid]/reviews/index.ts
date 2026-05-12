import { NextApiRequest, NextApiResponse } from 'next'
import { Provider } from 'server/provider'
import { ReviewService } from 'server/service/review.service'
import { UserService } from 'server/service/user.service'
import { z } from 'zod'
import { NotFoundError, UserNotFoundError } from 'server/domain/error'
import { ClubUuidParamsSchema, UpdateClubReviewSchema } from 'src/lib/schemas/clubs'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const userService = Provider.getService(UserService)
    const reviewService = Provider.getService(ReviewService)

    if (req.method == 'POST') {
      const { uuid: clubUuid } = ClubUuidParamsSchema.parse(req.query)
      const user = await userService.getUserByAccountId(req.headers.user as string)
      const body = UpdateClubReviewSchema.parse(req.body)
      await reviewService.reviewClub(user.serviceUserId, clubUuid, body)
      return res.status(204).send(null)
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
    console.error('reviewClub error: ', err)
    return res.status(500).send('Internal Server Error')
  }
}
