import { NextApiRequest, NextApiResponse } from 'next'
import { ZodIssue, z } from 'zod'
import { Provider } from 'server/provider'
import { ForbiddenError } from 'server/domain/error'
import { AdminClubService } from 'server/service/admin-club.service'
import { UserService } from 'server/service/user.service'
import {
  AdminClubVerificationRequestsQuerySchema,
  type AdminClubVerificationRequestsResponse,
} from 'src/lib/schemas/admin'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AdminClubVerificationRequestsResponse | string | ZodIssue[]>,
) {
  try {
    const userService = Provider.getService(UserService)
    const adminClubService = Provider.getService(AdminClubService)
    await userService.assertAdminRole(req.headers.user as string)

    if (req.method === 'GET') {
      const query = AdminClubVerificationRequestsQuerySchema.parse(req.query)
      const result = await adminClubService.getAdminClubVerificationRequests(query)

      return res.status(200).json({
        success: true,
        message: '공식 인증 요청 목록 조회가 완료되었습니다.',
        data: result,
      })
    }
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return res.status(403).send('Forbidden')
    }
    if (err instanceof z.ZodError) {
      return res.status(400).json(err.errors)
    }
    console.error('getAdminClubVerificationRequests error: ', err)
    return res.status(500).send('Internal Server Error')
  }

  return res.status(405).end()
}
