import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { Provider } from 'server/provider'
import { UserService } from 'server/service/user.service'
import { UserNotFoundError } from 'server/domain/error'
import { SlackService } from '../../../../../../server/service/slack.service'
import { UserVoiceSchema } from 'src/lib/schemas/users'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const userService = Provider.getService(UserService)
    const slackService = Provider.getService(SlackService)
    if (req.method == 'POST') {
      try {
        const user = await userService.getUserByAccountId(req.headers.user as string)
        const { content } = UserVoiceSchema.parse(req.body)
        await userService.throwUserVoice(user.serviceUserId, content)
        await slackService.sendMessage(
          'DRAGONITE',
          'C0AEQRLAGMU',
          `*행운의 망나뇽이 유저의 소중한 의견을 들고왔어요*
유저 이름: ${user.name || user.nickname}
유저 연락처: ${user.phone}
편지 본문: "${content}"`,
        )
        return res.status(204).send(null)
      } catch (err) {
        if (err instanceof UserNotFoundError) {
          return res.status(404).send('user not found')
        }
        if (err instanceof z.ZodError) {
          return res.status(400).json(err.errors)
        }
        console.error(err)
        return res.status(500).send('internal server error')
      }
    }
  } catch (err) {
    console.error('updateDevice error: ', err)
    return res.status(500).send('Internal Server Error')
  }
}
