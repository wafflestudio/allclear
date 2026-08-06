import { NextApiRequest, NextApiResponse } from 'next'
import { ZodIssue, z } from 'zod'
import { Provider } from 'server/provider'
import { AdminClubService } from 'server/service/admin-club.service'
import { UserService } from 'server/service/user.service'
import { ForbiddenError } from 'server/domain/error'
import { AdminClubsQuerySchema, type AdminClubsResponse } from 'src/lib/schemas/admin'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AdminClubsResponse | string | ZodIssue[]>,
) {
  try {
    const userService = Provider.getService(UserService)
    const adminClubService = Provider.getService(AdminClubService)
    await userService.assertAdminRole(req.headers.user as string)

    if (req.method === 'GET') {
      const query = AdminClubsQuerySchema.parse(req.query)
      const result = await adminClubService.getAdminClubs(query)
      return res.status(200).json({
        success: true,
        message: '동아리 목록 조회가 완료되었습니다.',
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
    console.error('getAdminClubs error: ', err)
    return res.status(500).send('Internal Server Error')
  }

  return res.status(405).end()
}
