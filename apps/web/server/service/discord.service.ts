import { ENV } from '../ENV'
import { Service } from '../provider'

@Service
export class DiscordService {
  async sendMessage(content: string): Promise<void> {
    if (!ENV.DISCORD.WEBHOOK_URL) {
      throw new Error('Discord webhook is not configured')
    }

    const webhookUrl = new URL(ENV.DISCORD.WEBHOOK_URL)
    webhookUrl.searchParams.set('wait', 'true')

    const response = await fetch(webhookUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        allowed_mentions: { parse: [] },
      }),
    })

    if (!response.ok) {
      throw new Error(`Discord webhook request failed with status ${response.status}`)
    }
  }
}
