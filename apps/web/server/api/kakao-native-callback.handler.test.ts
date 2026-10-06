import type { NextApiRequest, NextApiResponse } from 'next'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getService: vi.fn(),
  getOrCreateKakaoUser: vi.fn(),
  sign: vi.fn(),
}))

vi.mock('server/provider', () => ({
  Provider: { getService: mocks.getService },
}))

vi.mock('server/service/auth.service', () => ({
  AuthService: class AuthService {},
}))

vi.mock('jsonwebtoken', () => ({
  default: { sign: mocks.sign },
}))

import handler from '../../pages/api/v2/auth/kakao/native/callback'

const createResponse = () => {
  const response = {
    status: vi.fn(),
    send: vi.fn(),
    json: vi.fn(),
  }
  response.status.mockReturnValue(response)
  response.send.mockReturnValue(response)
  response.json.mockReturnValue(response)
  return response
}

describe('Kakao native callback logging', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getService.mockReturnValue({
      getOrCreateKakaoUser: mocks.getOrCreateKakaoUser,
    })
    mocks.getOrCreateKakaoUser.mockResolvedValue('account-id')
    mocks.sign.mockReturnValue('app-jwt')
  })

  it('does not log the raw Kakao access token', async () => {
    const accessToken = 'raw-kakao-access-token'
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const response = createResponse()

    await handler(
      {
        method: 'POST',
        body: { accessToken },
      } as unknown as NextApiRequest,
      response as unknown as NextApiResponse,
    )

    expect(response.status).toHaveBeenCalledWith(200)
    expect(consoleLog).not.toHaveBeenCalled()
    expect(JSON.stringify(consoleLog.mock.calls)).not.toContain(accessToken)
    consoleLog.mockRestore()
  })
})
