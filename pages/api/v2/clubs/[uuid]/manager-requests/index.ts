import { NextApiRequest, NextApiResponse } from 'next'
import { ZodIssue, z } from 'zod'
import { Provider } from 'server/provider'
import { ClubService } from 'server/service/club.service'
import { UserService } from 'server/service/user.service'
import { ConflictError, NotFoundError, UserNotFoundError } from 'server/domain/error'
import { ClubUuidParamsSchema } from 'src/lib/schemas/clubs'
import { ClubManagerRequestSchema } from 'src/lib/schemas/managers'

type ClubManagerRequestResponse = {
  success: boolean
  message: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ClubManagerRequestResponse | string | ZodIssue[]>,
) {
  try {
    const clubService = Provider.getService(ClubService)
    const userService = Provider.getService(UserService)

    if (req.method === 'POST') {
      const user = await userService.getUserByAccountId(req.headers.user as string)
      const { uuid: clubUuid } = ClubUuidParamsSchema.parse(req.query)
      const body = ClubManagerRequestSchema.parse(req.body)

      await clubService.createClubManagerRequest(clubUuid, user.serviceUserId, body)

      return res.status(201).json({
        success: true,
        message: '동아리 관리 권한 신청이 완료되었습니다. 운영진 검토 후 승인됩니다.',
      })
    }
  } catch (err) {
    if (err instanceof UserNotFoundError) {
      return res.status(401).send('Unauthorized')
    }
    if (err instanceof NotFoundError) {
      return res.status(404).send('Not Found')
    }
    if (err instanceof ConflictError) {
      return res.status(409).send(err.message)
    }
    if (err instanceof z.ZodError) {
      return res.status(400).json(err.errors)
    }
    console.error('createClubManagerRequest error: ', err)
    return res.status(500).send('Internal Server Error')
  }

  return res.status(405).end()
}
