import type { NextApiRequest, NextApiResponse } from 'next'
import { ForbiddenError, NotFoundError } from 'server/domain/error'
import { Provider } from 'server/provider'
import type { AdminClubDetailResponse } from 'server/schemas/admin'
import { ClubUuidParamsSchema } from 'server/schemas/clubs'
import { AdminClubService } from 'server/service/admin-club.service'
import { UserService } from 'server/service/user.service'
import { type ZodIssue, z } from 'zod'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AdminClubDetailResponse | string | ZodIssue[]>,
) {
  try {
    const userService = Provider.getService(UserService)
    const adminClubService = Provider.getService(AdminClubService)
    await userService.assertAdminRole(req.headers.user as string)

    if (req.method === 'GET') {
      const { uuid: clubUuid } = ClubUuidParamsSchema.parse(req.query)
      const detail = await adminClubService.getAdminClubDetail(clubUuid)

      return res.status(200).json({
        success: true,
        data: detail,
      })
    }
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return res.status(403).send('Forbidden')
    }
    if (err instanceof NotFoundError) {
      return res.status(404).send('club not found')
    }
    if (err instanceof z.ZodError) {
      return res.status(400).json(err.errors)
    }
    console.error('getAdminClubDetail error: ', err)
    return res.status(500).send('Internal Server Error')
  }

  return res.status(405).end()
}
