import type { NextApiRequest, NextApiResponse } from 'next'
import { UserNotFoundError } from 'server/domain/error'
import type { ManagedClubListItem } from 'server/domain/model/Club'
import { Provider } from 'server/provider'
import { ClubService } from 'server/service/club.service'
import { UserService } from 'server/service/user.service'

type ResponseData = {
  success: true
  message: string
  data: {
    total_count: number
    clubs: ManagedClubListItem[]
  }
}

// const app = new App({
//   token: ENV.SLACK.TOKEN.DRAGONITE,
//   signingSecret: ENV.SLACK.SIGNING_SECRET,
// })
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | string | null>,
) {
  try {
    const clubService = Provider.getService(ClubService)
    const userService = Provider.getService(UserService)
    const user = await userService.getUserByAccountId(req.headers.user as string)
    if (req.method == 'GET') {
      const clubs = await clubService.findAllManagedByUser(user.serviceUserId)
      return res.status(200).json({
        success: true,
        message: '관리 중인 동아리 목록 및 신청 현황 조회가 완료되었습니다.',
        data: {
          total_count: clubs.length,
          clubs: clubs,
        },
      })
    }
  } catch (err) {
    if (err instanceof UserNotFoundError) {
      return res.status(401).send('Unauthorized')
    }
    console.error('listClubsManagedByMe error: ', err)
    return res.status(500).send('Internal Server Error')
  }

  return res.status(405).end()
}
