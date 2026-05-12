import { Club } from 'server/domain/model/Club'
import { NextApiRequest, NextApiResponse } from 'next'
import { Provider } from 'server/provider'
import { ClubService } from 'server/service/club.service'
import { UserNotFoundError } from 'server/domain/error'
import { UserService } from 'server/service/user.service'
import { SlackService } from '../../../../../../server/service/slack.service'
import { ClubManagerRegisterRequestSchema } from 'src/lib/schemas/managers'

type ResponseData = {
  success: true
  message: string
  data: {
    total_count: number
    clubs: Club[]
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
    const slackService = Provider.getService(SlackService)

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
    if (req.method === 'POST') {
      const { clubId, name, phone, studentId } = ClubManagerRegisterRequestSchema.parse(req.body)
      const requestName = name || user.name || user.nickname
      const requestPhone = phone || user.phone
      const requestStudentId = studentId || String(user.admissionClass ?? '')
      await clubService.clubManagerRegisterRequest(user.serviceUserId, {
        clubId,
        name: requestName,
        phone: requestPhone,
        studentId: requestStudentId,
      })
      const clubs: Club[] = [await clubService.findByUuid(clubId)]
      const clubDetails = clubs.map((club) => `- ${club.name} (ID: \`${club.id}\`)`).join('\n')
      await slackService.sendMessage(
        'DRAGONITE',
        'C0AEQRLAGMU',
        `*행운의 망나뇽이 동아리 관리자 등록 요청을 들고왔어요*
유저: ${user.name || user.nickname} (Service User ID: ${user.serviceUserId})
신청자명: ${requestName}
연락처: ${requestPhone}
학번: ${requestStudentId}
동아리:\n${clubDetails}`,
      )
      return res.status(204).send(null)
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
