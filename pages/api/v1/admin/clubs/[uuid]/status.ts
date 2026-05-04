import { NextApiRequest, NextApiResponse } from 'next'
import { ZodIssue, z } from 'zod'
import { Provider } from 'server/provider'
import { AdminClubService } from 'server/service/admin-club.service'
import { UserService } from 'server/service/user.service'
import { BadRequestError, ForbiddenError, NotFoundError } from 'server/domain/error'
import { ClubUuidParamsSchema } from 'src/lib/schemas/clubs'
import { AdminClubStatusUpdateResponse, AdminClubStatusUpdateSchema } from 'src/lib/schemas/admin'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AdminClubStatusUpdateResponse | string | ZodIssue[]>,
) {
  try {
    const userService = Provider.getService(UserService)
    const adminClubService = Provider.getService(AdminClubService)
    await userService.assertAdminRole(req.headers.user as string)

    if (req.method === 'PATCH') {
      const { uuid: clubUuid } = ClubUuidParamsSchema.parse(req.query)
      const body = AdminClubStatusUpdateSchema.parse(req.body)
      const result = await adminClubService.updateAdminClubStatus(clubUuid, body)

      return res.status(200).json({
        success: true,
        message: '상태 변경이 완료되었습니다.',
        data: result,
      })
    }
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return res.status(403).send('Forbidden')
    }
    if (err instanceof NotFoundError) {
      return res.status(404).send('club not found')
    }
    if (err instanceof BadRequestError) {
      return res.status(400).send(err.message)
    }
    if (err instanceof z.ZodError) {
      return res.status(400).json(err.errors)
    }
    console.error('updateAdminClubStatus error: ', err)
    return res.status(500).send('Internal Server Error')
  }

  return res.status(405).end()
}
