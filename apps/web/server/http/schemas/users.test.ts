import { describe, expect, it } from 'vitest'
import { UserNotificationSchema } from './users'

describe('user notification schema', () => {
  it('exposes manager transfer completion metadata to the previous manager', () => {
    expect(
      UserNotificationSchema.parse({
        id: '12',
        type: 'MANAGER_TRANSFER_COMPLETED',
        clubId: '4dfcd19f-9f20-4128-8b4c-b76deab4b65d',
        sourceType: 'MANAGER_TRANSFER',
        sourceId: '10',
        metadata: { clubName: '와플스튜디오' },
        readAt: null,
        createdAt: '2026-08-24T00:00:00.000Z',
      }),
    ).toEqual({
      id: '12',
      type: 'MANAGER_TRANSFER_COMPLETED',
      clubId: '4dfcd19f-9f20-4128-8b4c-b76deab4b65d',
      sourceType: 'MANAGER_TRANSFER',
      sourceId: '10',
      metadata: { clubName: '와플스튜디오' },
      readAt: null,
      createdAt: '2026-08-24T00:00:00.000Z',
    })
  })
})
