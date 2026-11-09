import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prisma } = vi.hoisted(() => ({
  prisma: {
    account: { findFirst: vi.fn(), updateMany: vi.fn() },
    account_user: { findFirst: vi.fn() },
    user: { findFirst: vi.fn(), updateMany: vi.fn() },
    allclear_user: { findFirst: vi.fn(), updateMany: vi.fn() },
    college_major: { findFirst: vi.fn(), findMany: vi.fn() },
    user_voice: { create: vi.fn() },
    user_activity_log: { create: vi.fn() },
    user_recent_search: {
      findMany: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('../provider', () => ({ Service: () => undefined }))
vi.mock('../infra/database/prisma', () => ({ getPrismaClient: () => prisma }))

import { UserRole } from '../domain/constants/user-role.enum'
import { ForbiddenError, UserNotFoundError } from '../domain/error'
import { UserService } from './user.service'

beforeEach(() => {
  vi.clearAllMocks()
  prisma.$transaction.mockImplementation(async (operation: any) =>
    Array.isArray(operation) ? Promise.all(operation) : operation(prisma),
  )
})

describe('UserService with Prisma', () => {
  it('loads an active linked user and maps their college major', async () => {
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

    await expect(new UserService().getUserByAccountId('account-id')).resolves.toEqual({
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
      where: { id: 'account-id', deleted_at: null },
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
  })

  it('rejects a linked account whose service user was deleted', async () => {
    prisma.account.findFirst.mockResolvedValue({ id: 'account-id' })
    prisma.account_user.findFirst.mockResolvedValue({ user_id: 'user-id' })
    prisma.user.findFirst.mockResolvedValue({ id: 'user-id' })
    prisma.allclear_user.findFirst.mockResolvedValue(null)
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    try {
      await expect(new UserService().getUserByAccountId('account-id')).rejects.toBeInstanceOf(
        UserNotFoundError,
      )
      expect(prisma.college_major.findFirst).not.toHaveBeenCalled()
    } finally {
      log.mockRestore()
    }
  })

  it('checks active user roles before allowing admin access or updates', async () => {
    const service = new UserService()
    prisma.account_user.findFirst.mockResolvedValue({ user_id: 'user-id' })
    prisma.user.findFirst
      .mockResolvedValueOnce({ role: UserRole.USER })
      .mockResolvedValueOnce({ role: UserRole.ADMIN })
      .mockResolvedValueOnce(null)

    await expect(service.assertAdminRole('account-id')).rejects.toBeInstanceOf(ForbiddenError)
    await expect(service.assertAdminRole('account-id')).resolves.toBeUndefined()
    await expect(service.updateUserRole('user-id', UserRole.ADMIN)).rejects.toBeInstanceOf(
      UserNotFoundError,
    )
    expect(prisma.user.updateMany).not.toHaveBeenCalled()
  })

  it('updates both profile records in one transaction', async () => {
    prisma.user.updateMany.mockResolvedValue({ count: 1 })
    prisma.allclear_user.updateMany.mockResolvedValue({ count: 1 })
    await new UserService().updateProfile(
      { id: 'user-id', serviceUserId: 'service-user-id' } as any,
      {
        nickname: 'New',
        name: 'Name',
        email: 'new@example.com',
        collegeMajorId: 3,
        admissionClass: 26,
      } as any,
    )
    expect(prisma.$transaction).toHaveBeenCalledOnce()
    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      data: {
        nickname: 'New',
        name: 'Name',
        email: 'new@example.com',
        updated_at: expect.any(Date),
      },
    })
    expect(prisma.allclear_user.updateMany).toHaveBeenCalledWith({
      where: { id: 'service-user-id' },
      data: { college_major_id: 3, admission_class: 26, updated_at: expect.any(Date) },
    })
  })

  it('normalizes and prunes recent searches inside a transaction', async () => {
    prisma.user_recent_search.upsert.mockResolvedValue({ id: BigInt(8) })
    prisma.user_recent_search.findMany.mockResolvedValueOnce([{ id: BigInt(1) }, { id: BigInt(2) }])
    prisma.user_recent_search.deleteMany.mockResolvedValue({ count: 2 })
    await new UserService().saveRecentSearch('service-user-id', '  music  ', 8)

    expect(prisma.$transaction).toHaveBeenCalledOnce()
    expect(prisma.user_recent_search.upsert).toHaveBeenCalledWith({
      where: { service_user_id_query: { service_user_id: 'service-user-id', query: 'music' } },
      create: { service_user_id: 'service-user-id', query: 'music' },
      update: { updated_at: expect.any(Date) },
    })
    expect(prisma.user_recent_search.findMany).toHaveBeenCalledWith({
      where: { service_user_id: 'service-user-id' },
      orderBy: { updated_at: 'desc' },
      skip: 8,
      select: { id: true },
    })
    expect(prisma.user_recent_search.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: [BigInt(1), BigInt(2)] } },
    })
  })

  it('returns recent searches with string timestamps and filters deleted majors', async () => {
    prisma.user_recent_search.findMany.mockResolvedValue([
      { query: 'music', updated_at: new Date('2026-10-11T00:00:00Z') },
    ])
    prisma.college_major.findMany.mockResolvedValue([
      { id: 3, college: 'Engineering', major: 'CS' },
    ])
    const service = new UserService()
    await expect(service.findRecentSearches('service-user-id')).resolves.toEqual([
      { query: 'music', updatedAt: '2026-10-11T00:00:00.000Z' },
    ])
    await expect(service.getCollegeMajors()).resolves.toEqual([
      { id: 3, college: 'Engineering', major: 'CS' },
    ])
    expect(prisma.college_major.findMany).toHaveBeenCalledWith({
      where: { deleted_at: null, major: { not: null } },
      orderBy: [{ college: 'asc' }, { id: 'asc' }],
    })
  })
})
