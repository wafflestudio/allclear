import { NextApiHandler } from 'next'
import { z } from 'zod'
import { Provider } from 'server/provider'
import { ClubServiceV1 } from 'server/service/v1/club.service'
import { NotFoundError } from 'server/domain/error'
import { UserServiceV1 } from '../../../../../../../server/service/v1/user.service'

const QueryValidator = z.object({
  serviceUserId: z.string().uuid(),
  uuid: z.string().uuid(),
})

const api: NextApiHandler = async (req, res) => {
  try {
    const clubService = Provider.getService(ClubServiceV1)
    const userService = Provider.getService(UserServiceV1)

    const { serviceUserId, uuid: clubUuid } = QueryValidator.parse(req.query)
    await userService.serviceUserShouldExist(serviceUserId)

    if (req.method === 'POST') {
      // POST /api/v1/managers/{service_user_id}/clubs/{club_uuid}
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
