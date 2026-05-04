import { NextApiHandler } from 'next'
import { z } from 'zod'
import { Provider } from 'server/provider'
import { ClubService } from 'server/service/club.service'
import { UserService } from 'server/service/user.service'
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UserNotFoundError,
} from 'server/domain/error'
import { ClubUuidParamsSchema } from 'src/lib/schemas/clubs'
import { ManagedClubPatchSchema } from 'src/lib/schemas/managers'

const api: NextApiHandler = async (req, res) => {
  try {
    const clubService = Provider.getService(ClubService)
    const userService = Provider.getService(UserService)

    const user = await userService.getUserByAccountId(req.headers.user as string)
    const { uuid: clubUuid } = ClubUuidParamsSchema.parse(req.query)
    if (req.method == 'GET') {
      const club = await clubService.getManagedClubByUuid(clubUuid, user.serviceUserId)
      return res.status(200).json(club)
    }

    if (req.method === 'PATCH') {
      const body = ManagedClubPatchSchema.parse(req.body)
      const result = await clubService.patchManagedClub(clubUuid, user.serviceUserId, body)
      return res.status(200).json({
        success: true,
        message: '동아리 정보가 수정되었으며, 수정 이력이 기록되었습니다.',
        data: {
          club_uuid: result.clubUuid,
          updated_at: result.updatedAt,
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
    if (err instanceof BadRequestError) {
      return res.status(400).send(err.message)
    }
    if (err instanceof z.ZodError) {
      return res.status(400).json(err.errors)
    }
    console.error('editClub error: ', err)
    return res.status(500).send('Internal Server Error')
  }

  return res.status(405).end()
}

export default api
