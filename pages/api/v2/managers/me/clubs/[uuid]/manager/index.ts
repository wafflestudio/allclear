import { NextApiRequest, NextApiResponse } from 'next'
import { ZodIssue, z } from 'zod'
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UserNotFoundError,
} from 'server/domain/error'
import { Provider } from 'server/provider'
import { ClubService } from 'server/service/club.service'
import { UserService } from 'server/service/user.service'
import { ClubUuidParamsSchema } from 'src/lib/schemas/clubs'
import {
  ClubRegistrationManagerPatchSchema,
  type ClubRegistrationManager,
} from 'src/lib/schemas/managers'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ClubRegistrationManager | string | ZodIssue[] | null>,
) {
  try {
    const clubService = Provider.getService(ClubService)
    const userService = Provider.getService(UserService)
    const user = await userService.getUserByAccountId(req.headers.user as string)
    const { uuid: clubUuid } = ClubUuidParamsSchema.parse(req.query)

    if (req.method === 'GET') {
      const manager = await clubService.getClubRegistrationManager(clubUuid, user.serviceUserId)
      return res.status(200).json(manager)
    }

    if (req.method === 'PATCH') {
      const body = ClubRegistrationManagerPatchSchema.parse(req.body)
      await clubService.updateClubRegistrationManager(clubUuid, user.serviceUserId, body)
      return res.status(204).end()
    }
  } catch (err) {
    if (err instanceof UserNotFoundError) {
      return res.status(401).send('Unauthorized')
    }
    if (err instanceof BadRequestError) {
      return res.status(400).send(err.message)
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
    console.error('clubRegistrationManager error: ', err)
    return res.status(500).send('Internal Server Error')
  }

  return res.status(405).end()
}
