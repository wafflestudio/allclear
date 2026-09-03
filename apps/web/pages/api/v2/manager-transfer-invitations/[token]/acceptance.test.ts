import type { NextApiRequest, NextApiResponse } from 'next'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getService: vi.fn(),
  getUserByAccountId: vi.fn(),
  acceptInvitation: vi.fn(),
}))

vi.mock('server/provider', () => ({
  InjectRepository: () => () => undefined,
  Provider: { getService: mocks.getService },
  Service: () => undefined,
}))

vi.mock('server/service/club-manager-transfer.service', () => ({
  ClubManagerTransferService: class ClubManagerTransferService {},
}))

vi.mock('server/service/user.service', () => ({
  UserService: class UserService {},
}))

import { ClubManagerTransferService } from 'server/service/club-manager-transfer.service'
import { UserService } from 'server/service/user.service'
import handler from './acceptance'

const token = 'a'.repeat(43)

const createResponse = () => {
  const response = {
    status: vi.fn(),
    send: vi.fn(),
    json: vi.fn(),
    end: vi.fn(),
  }
  response.status.mockReturnValue(response)
  response.send.mockReturnValue(response)
  response.json.mockReturnValue(response)
  response.end.mockReturnValue(response)
  return response
}

describe('manager transfer acceptance API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getService.mockImplementation((service) => {
      if (service === UserService) {
        return { getUserByAccountId: mocks.getUserByAccountId }
      }
      if (service === ClubManagerTransferService) {
        return { acceptInvitation: mocks.acceptInvitation }
      }
      throw new Error('unexpected service')
    })
    mocks.getUserByAccountId.mockResolvedValue({ serviceUserId: 'recipient' })
  })

  it('returns an opaque 500 and logs only safe metadata for unexpected failures', async () => {
    const failure = new Error(`database failed for ${token}`)
    mocks.acceptInvitation.mockRejectedValue(failure)
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const response = createResponse()

    await handler(
      {
        method: 'PUT',
        headers: { user: 'account-id' },
        query: { token },
      } as unknown as NextApiRequest,
      response as unknown as NextApiResponse,
    )

    expect(response.status).toHaveBeenCalledWith(500)
    expect(response.send).toHaveBeenCalledWith('Internal Server Error')
    expect(consoleError).toHaveBeenCalledWith('accept manager transfer invitation failed', {
      errorName: 'Error',
    })
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(token)

    consoleError.mockRestore()
  })
})
