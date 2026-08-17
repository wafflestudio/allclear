import type { NextApiRequest, NextApiResponse } from 'next'
import { UserNotFoundError } from 'server/domain/error'
import { Provider } from 'server/provider'
import { DiscordService } from 'server/service/discord.service'
import { UserService } from 'server/service/user.service'
import { UserVoiceSchema } from 'src/lib/schemas/users'
import { z } from 'zod'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const userService = Provider.getService(UserService)
    const discordService = Provider.getService(DiscordService)
    if (req.method == 'POST') {
      try {
        const user = await userService.getUserByAccountId(req.headers.user as string)
        const { content } = UserVoiceSchema.parse(req.body)
        await userService.throwUserVoice(user.serviceUserId, content)
        await discordService.sendMessage(
          `**올클 사용자의 소중한 의견이 도착했어요**
유저 이름: ${user.name || user.nickname}
유저 연락처: ${user.phone}
의견: ${content}`,
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
    console.error('createUserVoice error: ', err)
    return res.status(500).send('Internal Server Error')
  }
}
