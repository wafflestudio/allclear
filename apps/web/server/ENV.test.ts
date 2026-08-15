import { afterEach, describe, expect, it, vi } from 'vitest'

describe('ENV.DISCORD', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('reads the user voice webhook from DISCORD_WEBHOOK_URL_USER_VOICE', async () => {
    vi.stubEnv('DISCORD_WEBHOOK_URL', '')
    vi.stubEnv(
      'DISCORD_WEBHOOK_URL_USER_VOICE',
      'https://discord.com/api/webhooks/user-voice-id/user-voice-token',
    )

    const { ENV } = await import('./ENV')

    expect(ENV.DISCORD.WEBHOOK_URL).toBe(
      'https://discord.com/api/webhooks/user-voice-id/user-voice-token',
    )
  })
})
