import { NextApiRequest, NextApiResponse } from 'next'
import { ZodIssue, z } from 'zod'
import { Provider } from 'server/provider'
import { ClubService } from 'server/service/club.service'
import { UserService } from 'server/service/user.service'
import { BadRequestError, UserNotFoundError } from 'server/domain/error'
import { ClubRegisterRequestSchema } from 'src/lib/schemas/managers'

type ClubRegisterResponse = {
  success: boolean
  message: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ClubRegisterResponse | string | ZodIssue[]>,
) {
  try {
    const clubService = Provider.getService(ClubService)
    const userService = Provider.getService(UserService)

    if (req.method === 'POST') {
      const user = await userService.getUserByAccountId(req.headers.user as string)
      const body = ClubRegisterRequestSchema.parse(req.body)
      await clubService.registerClub(user.serviceUserId, body)

      return res.status(201).json({
        success: true,
        message: '동아리 등록 신청이 완료되었습니다.',
      })
    }
  } catch (err) {
    if (err instanceof UserNotFoundError) {
      return res.status(401).send('Unauthorized')
    }
    if (err instanceof BadRequestError) {
      return res.status(400).json({
        success: false,
        message: err.message,
      })
    }
    if (err instanceof z.ZodError) {
      return res.status(400).json(err.errors)
    }
    console.error('registerClub error: ', err)
    return res.status(500).send('Internal Server Error')
  }

  return res.status(405).end()
}
