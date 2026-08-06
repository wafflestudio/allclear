import { NextApiHandler } from 'next'
import { z } from 'zod'
import { Provider } from 'server/provider'
import { ClubService } from 'server/service/club.service'
import { NotFoundError } from 'server/domain/error'
import { UserService } from '../../../../../../../server/service/user.service'
import { ManagerClubParamsSchema } from 'src/lib/schemas/managers'

const api: NextApiHandler = async (req, res) => {
  try {
    const clubService = Provider.getService(ClubService)
    const userService = Provider.getService(UserService)

    const { serviceUserId, uuid: clubUuid } = ManagerClubParamsSchema.parse(req.query)
    await userService.serviceUserShouldExist(serviceUserId)

    if (req.method === 'POST') {
      // POST /api/v2/managers/{service_user_id}/clubs/{club_uuid}
      await clubService.registerClubManager(serviceUserId, clubUuid)
      return res.status(201).end()
    }
  } catch (err) {
    if (err instanceof NotFoundError) {
      return res.status(404).send('resource not found')
    }
    if (err instanceof z.ZodError) {
      return res.status(400).json(err.errors)
    }
    console.error('register club manager by admin error: ', err)
    return res.status(500).send('Internal Server Error')
  }
  return res.status(405).end() // Method Not Allowed
}

export default api
