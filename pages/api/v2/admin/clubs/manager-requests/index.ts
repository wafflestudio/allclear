import { NextApiRequest, NextApiResponse } from 'next'
import { ZodIssue, z } from 'zod'
import { Provider } from 'server/provider'
import { ForbiddenError } from 'server/domain/error'
import { AdminClubService } from 'server/service/admin-club.service'
import { UserService } from 'server/service/user.service'
import {
  AdminClubManagerRequestsQuerySchema,
  type AdminClubManagerRequestsResponse,
} from 'src/lib/schemas/admin'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AdminClubManagerRequestsResponse | string | ZodIssue[]>,
) {
  try {
    const userService = Provider.getService(UserService)
    const adminClubService = Provider.getService(AdminClubService)
    await userService.assertAdminRole(req.headers.user as string)

    if (req.method === 'GET') {
      const query = AdminClubManagerRequestsQuerySchema.parse(req.query)
      const requests = await adminClubService.getAdminClubManagerRequests(query)

      return res.status(200).json({
        success: true,
        message: '매핑 신청 목록 조회가 완료되었습니다.',
        data: {
          total_count: requests.length,
          requests,
        },
      })
    }
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return res.status(403).send('Forbidden')
    }
    if (err instanceof z.ZodError) {
      return res.status(400).json(err.errors)
    }
    console.error('getAdminClubManagerRequests error: ', err)
    return res.status(500).send('Internal Server Error')
  }

  return res.status(405).end()
}
