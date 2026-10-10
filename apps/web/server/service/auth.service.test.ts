import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prisma } = vi.hoisted(() => ({
  prisma: {
    account: { findFirst: vi.fn(), create: vi.fn() },
    account_user: { findFirst: vi.fn(), create: vi.fn() },
    user: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
    allclear_user: { findFirst: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
    college_major: { findFirst: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock('../provider', () => ({ Service: () => undefined }))
vi.mock('../infra/database/prisma', () => ({ getPrismaClient: () => prisma }))
vi.mock('axios', () => ({ default: vi.fn() }))

import axios from 'axios'
import { UserNotFoundError } from '../domain/error'
import { AccountType } from '../infra/database/entities/account-type.enum'
import { AuthService } from './auth.service'

beforeEach(() => {
  vi.clearAllMocks()
  prisma.$transaction.mockImplementation(async (operation: any) =>
    Array.isArray(operation) ? Promise.all(operation) : operation(prisma),
  )
})

describe('AuthService with Prisma', () => {
  it('does not log the Kakao profile returned by the provider', async () => {
    vi.mocked(axios).mockResolvedValue({
      data: {
        id: 'kakao-user-id',
        kakao_account: { email: 'private@example.com', phone_number: '+82 10-1234-5678' },
      },
    })
    prisma.account.findFirst.mockResolvedValue({ id: 'account-id' })
    prisma.account_user.findFirst.mockResolvedValue({ user_id: 'user-id' })
    prisma.user.findUnique.mockResolvedValue({ id: 'user-id', deleted_at: null })
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    try {
      await expect(new AuthService().getOrCreateKakaoUser('raw-access-token')).resolves.toBe(
        'account-id',
      )
      expect(consoleLog).not.toHaveBeenCalled()
    } finally {
      consoleLog.mockRestore()
    }
  })

  it('maps an active OAuth user and excludes soft-deleted records', async () => {
    prisma.account.findFirst.mockResolvedValue({ id: 'account-id' })
    prisma.account_user.findFirst.mockResolvedValue({ user_id: 'user-id' })
    prisma.user.findFirst.mockResolvedValue({
      id: 'user-id',
      nickname: 'Nick',
      name: 'Name',
      phone: '010',
      email: 'a@example.com',
    })
    prisma.allclear_user.findFirst.mockResolvedValue({
      id: 'service-user-id',
      admission_class: 26,
      college_major_id: 3,
    })
    prisma.college_major.findFirst.mockResolvedValue({ id: 3, college: 'Engineering', major: 'CS' })

    await expect(
      new AuthService().getUserByOauthId(AccountType.KAKAO, 'oauth-id'),
    ).resolves.toEqual({
      id: 'user-id',
      serviceUserId: 'service-user-id',
      nickname: 'Nick',
      name: 'Name',
      phone: '010',
      email: 'a@example.com',
      admissionClass: 26,
      collegeMajor: { id: 3, college: 'Engineering', major: 'CS' },
    })
    expect(prisma.account.findFirst).toHaveBeenCalledWith({
      where: { type: AccountType.KAKAO, username: 'oauth-id', deleted_at: null },
    })
    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { id: 'user-id', deleted_at: null },
    })
    expect(prisma.allclear_user.findFirst).toHaveBeenCalledWith({
      where: { user_id: 'user-id', deleted_at: null },
    })
    expect(prisma.college_major.findFirst).toHaveBeenCalledWith({
      where: { id: 3, deleted_at: null },
    })

    prisma.allclear_user.findFirst.mockResolvedValueOnce(null)
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    try {
      await expect(
        new AuthService().getUserByOauthId(AccountType.KAKAO, 'oauth-id'),
      ).rejects.toBeInstanceOf(UserNotFoundError)
    } finally {
      log.mockRestore()
    }
  })

  it('creates the account, user and links in one transaction', async () => {
    prisma.account.create.mockResolvedValue({ id: 'account-id' })
    prisma.user.create.mockResolvedValue({ id: 'user-id' })
    prisma.account_user.create.mockResolvedValue({})
    prisma.allclear_user.create.mockResolvedValue({})
    await expect(
      new AuthService().createUserByOauth({
        type: AccountType.APPLE,
        username: 'oauth-id',
        nickname: 'Nick',
        socialAccountInfo: { email: 'private@example.com' },
      }),
    ).resolves.toBe('account-id')

    expect(prisma.$transaction).toHaveBeenCalledOnce()
    expect(prisma.account.create).toHaveBeenCalledWith({
      data: {
        type: AccountType.APPLE,
        username: 'oauth-id',
        social_info: { email: 'private@example.com' },
      },
    })
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        nickname: 'Nick',
        name: '',
        phone: '',
        email: '',
        role: 'user',
      },
    })
    expect(prisma.account_user.create).toHaveBeenCalledWith({
      data: { account_id: 'account-id', user_id: 'user-id' },
    })
    expect(prisma.allclear_user.create).toHaveBeenCalledWith({ data: { user_id: 'user-id' } })
  })

  it('restores both user records when an existing OAuth user was deleted', async () => {
    prisma.account.findFirst.mockResolvedValue({ id: 'account-id' })
    prisma.account_user.findFirst.mockResolvedValue({ user_id: 'user-id' })
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-id',
      deleted_at: new Date('2026-10-01T00:00:00Z'),
    })
    prisma.user.updateMany.mockResolvedValue({ count: 1 })
    prisma.allclear_user.updateMany.mockResolvedValue({ count: 1 })

    await expect(
      new AuthService().findOrRestoreAccount(AccountType.KAKAO, 'oauth-id'),
    ).resolves.toEqual({ id: 'account-id' })
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      select: { id: true, deleted_at: true },
    })
    expect(prisma.$transaction).toHaveBeenCalledOnce()
    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      data: { deleted_at: null, updated_at: expect.any(Date) },
    })
    expect(prisma.allclear_user.updateMany).toHaveBeenCalledWith({
      where: { user_id: 'user-id' },
      data: { deleted_at: null, updated_at: expect.any(Date) },
    })
  })

  it('soft-deletes both user records in one transaction', async () => {
    prisma.user.updateMany.mockResolvedValue({ count: 1 })
    prisma.allclear_user.updateMany.mockResolvedValue({ count: 1 })
    await new AuthService().leaveUser('user-id')
    expect(prisma.$transaction).toHaveBeenCalledOnce()
    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      data: { deleted_at: expect.any(Date), updated_at: expect.any(Date) },
    })
    expect(prisma.allclear_user.updateMany).toHaveBeenCalledWith({
      where: { user_id: 'user-id' },
      data: { deleted_at: expect.any(Date), updated_at: expect.any(Date) },
    })
  })
})
