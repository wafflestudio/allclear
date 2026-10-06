import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../provider', () => ({
  InjectRepository: () => () => undefined,
  Service: () => undefined,
}))

vi.mock('axios', () => ({ default: vi.fn() }))

import axios from 'axios'
import { AccountType } from '../infra/database/entities'
import { AuthService } from './auth.service'

describe('AuthService Kakao logging', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not log the Kakao profile returned by the provider', async () => {
    vi.mocked(axios).mockResolvedValue({
      data: {
        id: 'kakao-user-id',
        kakao_account: {
          email: 'private@example.com',
          phone_number: '+82 10-1234-5678',
        },
      },
    })
    const accountRepository = {
      findOneBy: vi.fn().mockResolvedValue({ id: 'account-id', type: AccountType.KAKAO }),
    }
    const accountUserRepository = {
      findOneBy: vi.fn().mockResolvedValue({ accountId: 'account-id', userId: 'user-id' }),
    }
    const userRepository = {
      findOne: vi.fn().mockResolvedValue({ id: 'user-id', deletedAt: null }),
    }
    const service = Object.create(AuthService.prototype) as AuthService
    Object.defineProperty(service, 'accountRepository', { value: accountRepository })
    Object.defineProperty(service, 'accountUserRepository', {
      value: accountUserRepository,
    })
    Object.defineProperty(service, 'userRepository', { value: userRepository })
    Object.defineProperty(service, 'serviceUserRepository', { value: {} })
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined)

    await expect(service.getOrCreateKakaoUser('raw-access-token')).resolves.toBe('account-id')

    expect(consoleLog).not.toHaveBeenCalled()
    consoleLog.mockRestore()
  })
})
