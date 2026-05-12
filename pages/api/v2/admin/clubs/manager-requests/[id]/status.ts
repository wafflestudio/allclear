import { NextApiRequest, NextApiResponse } from 'next'
import { ZodIssue, z } from 'zod'
import { Provider } from 'server/provider'
import { ConflictError, ForbiddenError, NotFoundError } from 'server/domain/error'
import { AdminClubService } from 'server/service/admin-club.service'
import { UserService } from 'server/service/user.service'
import {
  AdminClubManagerRequestStatusParamsSchema,
  AdminClubManagerRequestStatusUpdateSchema,
  type AdminClubManagerRequestStatusUpdateResponse,
} from 'src/lib/schemas/admin'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AdminClubManagerRequestStatusUpdateResponse | string | ZodIssue[]>,
) {
  try {
    const userService = Provider.getService(UserService)
    const adminClubService = Provider.getService(AdminClubService)
    await userService.assertAdminRole(req.headers.user as string)

    if (req.method === 'PATCH') {
      const { id } = AdminClubManagerRequestStatusParamsSchema.parse(req.query)
      const body = AdminClubManagerRequestStatusUpdateSchema.parse(req.body)
      const result = await adminClubService.updateAdminClubManagerRequestStatus(id, body)

      return res.status(200).json({
        success: true,
        message: '매핑 신청 처리가 완료되었습니다.',
        data: result,
      })
    }
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return res.status(403).send('Forbidden')
    }
    if (err instanceof NotFoundError) {
      return res.status(404).send('manager request not found')
    }
    if (err instanceof ConflictError) {
      return res.status(409).send(err.message)
    }
    if (err instanceof z.ZodError) {
      return res.status(400).json(err.errors)
    }
    console.error('updateAdminClubManagerRequestStatus error: ', err)
    return res.status(500).send('Internal Server Error')
  }

  return res.status(405).end()
}
