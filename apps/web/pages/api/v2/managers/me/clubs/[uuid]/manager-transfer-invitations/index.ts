import type { NextApiRequest, NextApiResponse } from 'next'
import { ForbiddenError, NotFoundError, UserNotFoundError } from 'server/domain/error'
import { Provider } from 'server/provider'
import { ClubManagerTransferService } from 'server/service/club-manager-transfer.service'
import { UserService } from 'server/service/user.service'
import { ClubUuidParamsSchema } from 'src/lib/schemas/clubs'
import type { ManagerTransferInvitationCreateResponse } from 'src/lib/schemas/manager-transfer'
import { type ZodIssue, z } from 'zod'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ManagerTransferInvitationCreateResponse | string | ZodIssue[]>,
) {
  if (req.method !== 'POST') {
    return res.status(405).end()
  }

  try {
    const userService = Provider.getService(UserService)
    const transferService = Provider.getService(ClubManagerTransferService)
    const user = await userService.getUserByAccountId(req.headers.user as string)
    const { uuid: clubUuid } = ClubUuidParamsSchema.parse(req.query)
    const invitation = await transferService.createInvitation(clubUuid, user.serviceUserId)

    return res.status(201).json({
      success: true,
      message: '관리자 권한 이전 링크를 만들었어요.',
      data: invitation,
    })
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return res.status(401).send('Unauthorized')
    }
    if (error instanceof ForbiddenError) {
      return res.status(403).send('Forbidden')
    }
    if (error instanceof NotFoundError) {
      return res.status(404).send('Not Found')
    }
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.errors)
    }
    console.error(
      'create manager transfer invitation failed',
      error instanceof Error ? error.name : '',
    )
    return res.status(500).send('Internal Server Error')
  }
}
