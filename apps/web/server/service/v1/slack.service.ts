import { WebClient } from '@slack/web-api'
import { Service } from 'server/provider'
import { ENV } from 'server/ENV'

type SlackBot = keyof typeof ENV.SLACK.TOKEN

@Service
export class SlackServiceV1 {
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
