import type { NextApiRequest, NextApiResponse } from 'next'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  decode: vi.fn(),
  getService: vi.fn(),
}))

vi.mock('server/provider', () => ({
  Provider: { getService: mocks.getService },
}))

vi.mock('server/service/auth.service', () => ({
  AuthService: class AuthService {},
}))

vi.mock('jsonwebtoken', () => ({
  default: {
    decode: mocks.decode,
    sign: vi.fn(),
  },
}))

import handler from '../../pages/api/v2/auth/apple/callback'

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

describe('Apple callback logging', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getService.mockReturnValue({})
  })

  it('does not log the raw Apple identity token when decoding fails', async () => {
    const identityToken = 'raw-apple-identity-token'
    mocks.decode.mockReturnValue(null)
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const response = createResponse()

    await handler(
      {
        method: 'POST',
        body: { id_token: identityToken },
      } as unknown as NextApiRequest,
      response as unknown as NextApiResponse,
    )

    expect(response.status).toHaveBeenCalledWith(401)
    expect(response.send).toHaveBeenCalledWith('Unauthorized')
    expect(consoleError).toHaveBeenCalledWith('appleLoginNativeCallback jwt.decode error')
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(identityToken)
    consoleError.mockRestore()
  })

  it('does not log decoded Apple profile data when the subject is missing', async () => {
    const privateEmail = 'private@example.com'
    mocks.decode.mockReturnValue({ email: privateEmail })
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const response = createResponse()

    await handler(
      {
        method: 'POST',
        body: { id_token: 'identity-token' },
      } as unknown as NextApiRequest,
      response as unknown as NextApiResponse,
    )

    expect(response.status).toHaveBeenCalledWith(401)
    expect(consoleError).toHaveBeenCalledWith('appleLoginNativeCallback missing sub')
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(privateEmail)
    consoleError.mockRestore()
  })
})
