import { NextApiRequest, NextApiResponse } from 'next'
import { timingSafeEqual } from 'crypto'
import { ZodIssue, z } from 'zod'
import { ENV } from 'server/ENV'
import { Provider } from 'server/provider'
import { UserService } from 'server/service/user.service'
import { UserNotFoundError } from 'server/domain/error'
import {
  AdminUserRoleUpdateParamsSchema,
  AdminUserRoleUpdateSchema,
  type AdminUserRoleUpdateResponse,
} from 'src/lib/schemas/admin'

const isValidAdminRoleApiKey = (apiKey: string | string[] | undefined): boolean => {
  const expectedApiKey = ENV.APP_VERSION_POLICY.API_KEY
  if (!expectedApiKey || !apiKey || Array.isArray(apiKey)) {
    return false
  }

  const expectedBuffer = new TextEncoder().encode(expectedApiKey)
  const actualBuffer = new TextEncoder().encode(apiKey)
  return (
    expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer)
  )
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AdminUserRoleUpdateResponse | string | ZodIssue[]>,
) {
  try {
    if (!isValidAdminRoleApiKey(req.headers['x-internal-api-key'])) {
      return res.status(401).send('Unauthorized')
    }

    if (req.method === 'PATCH') {
      const { userId } = AdminUserRoleUpdateParamsSchema.parse(req.query)
      const body = AdminUserRoleUpdateSchema.parse(req.body)

      const userService = Provider.getService(UserService)
      await userService.updateUserRole(userId, body.role)

      return res.status(200).json({
        success: true,
        message: '사용자 권한이 변경되었습니다.',
        data: {
          user_id: userId,
          role: body.role,
        },
      })
    }
  } catch (err) {
    if (err instanceof UserNotFoundError) {
      return res.status(404).send('User not found')
    }
    if (err instanceof z.ZodError) {
      return res.status(400).json(err.errors)
    }
    console.error('updateUserRole error: ', err)
    return res.status(500).send('Internal Server Error')
  }

  return res.status(405).end()
}
