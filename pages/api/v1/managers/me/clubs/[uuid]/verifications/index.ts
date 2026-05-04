import { NextApiRequest, NextApiResponse } from 'next'
import { z, ZodIssue } from 'zod'
import { Provider } from 'server/provider'
import { ClubVerificationService } from 'server/service/club-verification.service'
import { UserService } from 'server/service/user.service'
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UserNotFoundError,
} from 'server/domain/error'
import { ClubUuidParamsSchema } from 'src/lib/schemas/clubs'
import { type CreateVerificationRequestResponse } from 'src/lib/schemas/managers'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreateVerificationRequestResponse | string | ZodIssue[]>,
) {
  try {
    const clubVerificationService = Provider.getService(ClubVerificationService)
    const userService = Provider.getService(UserService)
    const user = await userService.getUserByAccountId(req.headers.user as string)
    const { uuid: clubUuid } = ClubUuidParamsSchema.parse(req.query)

    if (req.method === 'POST') {
      const request = await clubVerificationService.requestVerification(
        clubUuid,
        user.serviceUserId,
      )
      return res.status(201).json({
        success: true,
        message: '총동연 공식 인증 요청이 완료되었습니다. 운영진 검토 후 반영됩니다.',
        data: {
          request_id: Number(request.id),
          club_uuid: request.clubId,
          status: 'PENDING',
          created_at: request.createdAt,
        },
      })
    }
  } catch (err) {
    if (err instanceof UserNotFoundError) {
      return res.status(401).send('Unauthorized')
    }
    if (err instanceof ForbiddenError) {
      return res.status(403).send('Forbidden')
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
    console.error('requestVerification error: ', err)
    return res.status(500).send('Internal Server Error')
  }

  return res.status(405).end()
}
