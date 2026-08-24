import type { NextApiRequest, NextApiResponse } from 'next'
import { ConflictError, NotFoundError, UserNotFoundError } from 'server/domain/error'
import { Provider } from 'server/provider'
import { ClubManagerTransferService } from 'server/service/club-manager-transfer.service'
import { UserService } from 'server/service/user.service'
import {
  type ManagerTransferAcceptanceResponse,
  ManagerTransferTokenParamsSchema,
} from 'src/lib/schemas/manager-transfer'
import { type ZodIssue, z } from 'zod'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ManagerTransferAcceptanceResponse | string | ZodIssue[]>,
) {
  if (req.method !== 'PUT') {
    return res.status(405).end()
  }

  try {
    const userService = Provider.getService(UserService)
    const transferService = Provider.getService(ClubManagerTransferService)
    const user = await userService.getUserByAccountId(req.headers.user as string)
    const { token } = ManagerTransferTokenParamsSchema.parse(req.query)
    const club = await transferService.acceptInvitation(token, user)

    return res.status(200).json({
      success: true,
      message: '관리자 권한을 이전받았어요.',
      data: club,
    })
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return res.status(401).send('Unauthorized')
    }
    if (error instanceof NotFoundError) {
      return res.status(404).send('Not Found')
    }
    if (error instanceof ConflictError) {
      return res.status(409).send('Conflict')
    }
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.errors)
    }
    console.error(
      'accept manager transfer invitation failed',
      error instanceof Error ? error.name : '',
    )
    return res.status(500).send('Internal Server Error')
  }
}
