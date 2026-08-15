import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../ENV', () => ({
  ENV: {
    DISCORD: {
      WEBHOOK_URL: 'https://discord.com/api/webhooks/webhook-id/webhook-token',
    },
  },
}))

vi.mock('../provider', () => ({
  Service: (constructor: unknown) => constructor,
}))

import { ENV } from '../ENV'
import { DiscordService } from './discord.service'

describe('DiscordService', () => {
  afterEach(() => {
    ENV.DISCORD.WEBHOOK_URL = 'https://discord.com/api/webhooks/webhook-id/webhook-token'
    vi.unstubAllGlobals()
  })

  it('sends feedback through a confirmed Discord webhook without mentions', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 })
    vi.stubGlobal('fetch', fetchMock)

    await new DiscordService().sendMessage('사용자 의견')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://discord.com/api/webhooks/webhook-id/webhook-token?wait=true',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: '사용자 의견',
          allowed_mentions: { parse: [] },
        }),
      },
    )
  })

  it('fails when Discord rejects the webhook request', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }))

    await expect(new DiscordService().sendMessage('사용자 의견')).rejects.toThrow(
      'Discord webhook request failed with status 404',
    )
  })

  it('fails before sending when the webhook is not configured', async () => {
    ENV.DISCORD.WEBHOOK_URL = ''
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(new DiscordService().sendMessage('사용자 의견')).rejects.toThrow(
      'Discord webhook is not configured',
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
