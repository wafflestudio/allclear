import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prisma, sign } = vi.hoisted(() => ({
  prisma: {
    account: { findFirst: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
    account_user: { findFirst: vi.fn(), create: vi.fn() },
    user: { findFirst: vi.fn(), create: vi.fn() },
    allclear_user: { findFirst: vi.fn(), create: vi.fn() },
    $transaction: vi.fn(),
  },
  sign: vi.fn(() => 'signed-token'),
}))

vi.mock('server/provider', () => ({ Service: () => undefined }))
vi.mock('server/infra/database/prisma', () => ({ getPrismaClient: () => prisma }))
vi.mock('jsonwebtoken', () => ({ default: { sign } }))

import { AccountType } from '../infra/database/entities/account-type.enum'
import { TestAuthService } from './test-auth.service'

beforeEach(() => {
  vi.clearAllMocks()
  prisma.$transaction.mockImplementation(async (callback: (tx: typeof prisma) => unknown) =>
    callback(prisma),
  )
})

describe('TestAuthService with Prisma', () => {
  it('reuses an active account, user and service user', async () => {
    prisma.account.findFirst.mockResolvedValue({ id: 'account-id' })
    prisma.account_user.findFirst.mockResolvedValue({ user_id: 'user-id' })
    prisma.user.findFirst.mockResolvedValue({ id: 'user-id' })
    prisma.allclear_user.findFirst.mockResolvedValue({ id: 'service-user-id' })
    prisma.account.updateMany.mockResolvedValue({ count: 1 })

    await expect(new TestAuthService().login({ username: 'tester' })).resolves.toEqual({
      token: 'signed-token',
      accountId: 'account-id',
      userId: 'user-id',
      serviceUserId: 'service-user-id',
      username: 'test:tester',
    })
    expect(prisma.account.findFirst).toHaveBeenCalledWith({
      where: { type: AccountType.KAKAO, username: 'test:tester', deleted_at: null },
      orderBy: { created_at: 'asc' },
    })
    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { id: 'user-id', deleted_at: null },
    })
    expect(prisma.allclear_user.findFirst).toHaveBeenCalledWith({
      where: { user_id: 'user-id', deleted_at: null },
    })
    expect(prisma.account.create).not.toHaveBeenCalled()
    expect(prisma.user.create).not.toHaveBeenCalled()
    expect(sign).toHaveBeenCalledWith({ sub: 'account-id' }, expect.any(String), {
      algorithm: 'HS256',
      expiresIn: '1y',
    })
    expect(prisma.account.updateMany).toHaveBeenCalledWith({
      where: { id: 'account-id' },
      data: {
        last_login_at: expect.any(Date),
        auth_token: 'signed-token',
        updated_at: expect.any(Date),
      },
    })
  })

  it('creates a missing account and linked user records', async () => {
    prisma.account.findFirst.mockResolvedValue(null)
    prisma.account.create.mockResolvedValue({ id: 'account-id' })
    prisma.account_user.findFirst.mockResolvedValue(null)
    prisma.user.create.mockResolvedValue({ id: 'user-id' })
    prisma.account_user.create.mockResolvedValue({})
    prisma.allclear_user.create.mockResolvedValue({ id: 'service-user-id' })
    prisma.account.updateMany.mockResolvedValue({ count: 1 })

    await expect(
      new TestAuthService().login({ username: 'tester', nickname: 'Nick' }),
    ).resolves.toMatchObject({
      accountId: 'account-id',
      userId: 'user-id',
      serviceUserId: 'service-user-id',
    })
    expect(prisma.account.create).toHaveBeenCalledWith({
      data: {
        type: AccountType.KAKAO,
        username: 'test:tester',
        social_info: { provider: 'test', username: 'tester' },
      },
    })
    expect(prisma.$transaction).toHaveBeenCalledOnce()
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: { nickname: 'Nick', name: 'Nick', email: 'tester@test.all-clear.local', role: 'user' },
    })
    expect(prisma.account_user.create).toHaveBeenCalledWith({
      data: { account_id: 'account-id', user_id: 'user-id' },
    })
    expect(prisma.allclear_user.create).toHaveBeenCalledWith({ data: { user_id: 'user-id' } })
  })

  it('creates a service user if an active linked user has none', async () => {
    prisma.account.findFirst.mockResolvedValue({ id: 'account-id' })
    prisma.account_user.findFirst.mockResolvedValue({ user_id: 'user-id' })
    prisma.user.findFirst.mockResolvedValue({ id: 'user-id' })
    prisma.allclear_user.findFirst.mockResolvedValue(null)
    prisma.allclear_user.create.mockResolvedValue({ id: 'new-service-user-id' })
    prisma.account.updateMany.mockResolvedValue({ count: 1 })

    await expect(new TestAuthService().login({ username: 'tester' })).resolves.toMatchObject({
      userId: 'user-id',
      serviceUserId: 'new-service-user-id',
    })
    expect(prisma.allclear_user.create).toHaveBeenCalledWith({ data: { user_id: 'user-id' } })
    expect(prisma.user.create).not.toHaveBeenCalled()
  })

  it('creates a new linked user when the old user was soft-deleted', async () => {
    prisma.account.findFirst.mockResolvedValue({ id: 'account-id' })
    prisma.account_user.findFirst.mockResolvedValue({ user_id: 'deleted-user-id' })
    prisma.user.findFirst.mockResolvedValue(null)
    prisma.user.create.mockResolvedValue({ id: 'new-user-id' })
    prisma.account_user.create.mockResolvedValue({})
    prisma.allclear_user.create.mockResolvedValue({ id: 'new-service-user-id' })
    prisma.account.updateMany.mockResolvedValue({ count: 1 })

    await expect(new TestAuthService().login({ username: 'tester' })).resolves.toMatchObject({
      userId: 'new-user-id',
      serviceUserId: 'new-service-user-id',
    })
    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { id: 'deleted-user-id', deleted_at: null },
    })
    expect(prisma.account_user.create).toHaveBeenCalledWith({
      data: { account_id: 'account-id', user_id: 'new-user-id' },
    })
  })
})
