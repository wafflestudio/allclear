import { describe, expect, it } from 'vitest'
import {
  ManagerTransferAcceptanceResponseSchema,
  ManagerTransferInvitationCreateResponseSchema,
  ManagerTransferInvitationResponseSchema,
  ManagerTransferTokenParamsSchema,
} from './manager-transfer'

const token = 'a'.repeat(43)
const clubUuid = '4dfcd19f-9f20-4128-8b4c-b76deab4b65d'

describe('manager transfer schemas', () => {
  it('accepts only a 256-bit base64url token', () => {
    expect(ManagerTransferTokenParamsSchema.parse({ token })).toEqual({ token })
    expect(() => ManagerTransferTokenParamsSchema.parse({ token: 'short' })).toThrow()
    expect(() => ManagerTransferTokenParamsSchema.parse({ token: `${'a'.repeat(42)}+` })).toThrow()
  })

  it('parses an invitation creation response', () => {
    expect(
      ManagerTransferInvitationCreateResponseSchema.parse({
        success: true,
        message: '관리자 권한 이전 링크를 만들었어요.',
        data: {
          transfer_url: `https://all-clear.cc/manager-transfer/${token}`,
          expires_at: '2026-08-27T00:00:00.000Z',
        },
      }),
    ).toEqual({
      success: true,
      message: '관리자 권한 이전 링크를 만들었어요.',
      data: {
        transfer_url: `https://all-clear.cc/manager-transfer/${token}`,
        expires_at: '2026-08-27T00:00:00.000Z',
      },
    })
  })

  it('keeps invitation and acceptance responses minimal', () => {
    expect(
      ManagerTransferInvitationResponseSchema.parse({
        success: true,
        message: '관리자 권한 이전 초대를 조회했어요.',
        data: {
          club_uuid: clubUuid,
          club_name: '와플스튜디오',
          expires_at: '2026-08-27T00:00:00.000Z',
          sender_service_user_id: 'should-not-leak',
        },
      }).data,
    ).toEqual({
      club_uuid: clubUuid,
      club_name: '와플스튜디오',
      expires_at: '2026-08-27T00:00:00.000Z',
    })

    expect(
      ManagerTransferAcceptanceResponseSchema.parse({
        success: true,
        message: '관리자 권한을 이전받았어요.',
        data: { club_uuid: clubUuid, club_name: '와플스튜디오' },
      }).data,
    ).toEqual({ club_uuid: clubUuid, club_name: '와플스튜디오' })
  })
})
