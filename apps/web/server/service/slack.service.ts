import { WebClient } from '@slack/web-api'
import { Service } from '../provider'
import { ENV } from '../ENV'

type SlackBot = keyof typeof ENV.SLACK.TOKEN

@Service
export class SlackService {
  private slackClients: Map<SlackBot, WebClient>

  constructor() {
    this.slackClients = new Map<SlackBot, WebClient>()
    for (const [key, token] of Object.entries(ENV.SLACK.TOKEN)) {
      this.slackClients.set(key as SlackBot, new WebClient(token))
    }
  }

  async sendMessage(bot: SlackBot, channel: string, text: string): Promise<void> {
    const client = this.slackClients.get(bot)
    if (!client) {
      throw new Error('Invalid bot')
    }
    await client.chat.postMessage({
      channel,
      text,
    })
  }
}
