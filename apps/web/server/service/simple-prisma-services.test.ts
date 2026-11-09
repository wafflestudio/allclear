import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prisma } = vi.hoisted(() => ({
  prisma: {
    app_version_policy: { findUnique: vi.fn(), upsert: vi.fn() },
    terms: { findMany: vi.fn() },
    terms_agreement: { createMany: vi.fn() },
    announcement: { findMany: vi.fn() },
    announcement_dismiss: { createMany: vi.fn() },
    user_notification: {
      findMany: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
      findFirst: vi.fn(),
    },
    user_activity_log: { create: vi.fn() },
  },
}))

vi.mock('../provider', () => ({
  Service: () => undefined,
  Inject: () => () => undefined,
  InjectRepository: () => () => undefined,
}))
vi.mock('server/provider', () => ({ Service: () => undefined }))
vi.mock('../infra/database/prisma', () => ({ getPrismaClient: () => prisma }))
vi.mock('../infra/redis/client', () => ({ getRedisClient: async () => null }))
vi.mock('server/infra/database/prisma', () => ({ getPrismaClient: () => prisma }))
vi.mock('server/infra/redis/client', () => ({ getRedisClient: async () => null }))

import { BadRequestError, NotFoundError } from '../domain/error'
import { AnnouncementService } from './announcement.service'
import { AppVersionService } from './app-version.service'
import { SearchLogService } from './search/search-log.service'
import { TermsService } from './terms.service'
import { UserNotificationService } from './user-notification.service'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Prisma-backed simple services', () => {
  it('keeps an unchanged app version policy without writing and updates a changed one', async () => {
    const service = new AppVersionService()
    prisma.app_version_policy.findUnique.mockResolvedValue({ min_supported_version: '1.2.3' })

    await expect(
      service.upsertPolicy({ clientType: 'ios', minSupportedVersion: '1.2.3' }),
    ).resolves.toEqual({
      clientType: 'ios',
      minSupportedVersion: '1.2.3',
    })
    expect(prisma.app_version_policy.upsert).not.toHaveBeenCalled()

    prisma.app_version_policy.upsert.mockResolvedValue({ min_supported_version: '1.2.4' })
    await service.upsertPolicy({ clientType: 'ios', minSupportedVersion: '1.2.4' })
    expect(prisma.app_version_policy.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { client_type: 'ios' },
        update: { min_supported_version: '1.2.4', updated_at: expect.any(Date) },
      }),
    )
  })

  it('maps unagreed terms and ignores duplicate agreement requests', async () => {
    const service = new TermsService()
    prisma.terms.findMany.mockResolvedValueOnce([
      {
        id: 7,
        uuid: 'term-uuid',
        terms_key: 'privacy',
        title: 'Privacy',
        content_url: '/privacy',
        version: '1',
        is_mandatory: true,
      },
    ])
    await expect(service.listUnagreedTerms('user-id')).resolves.toEqual([
      {
        uuid: 'term-uuid',
        termsKey: 'privacy',
        title: 'Privacy',
        contentUrl: '/privacy',
        version: '1',
        isMandatory: true,
      },
    ])
    expect(prisma.terms.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { active: true, terms_agreement: { none: { user_id: 'user-id' } } },
      }),
    )

    prisma.terms.findMany.mockResolvedValueOnce([{ id: 7, uuid: 'term-uuid' }])
    await service.agreeToTerms('user-id', ['term-uuid', 'term-uuid'])
    expect(prisma.terms_agreement.createMany).toHaveBeenCalledWith({
      data: [{ user_id: 'user-id', terms_id: 7 }],
      skipDuplicates: true,
    })
    prisma.terms.findMany.mockResolvedValueOnce([])
    await expect(service.agreeToTerms('user-id', ['missing'])).rejects.toBeInstanceOf(
      BadRequestError,
    )
  })

  it('filters dismissed announcements and ignores duplicate dismissals', async () => {
    const service = new AnnouncementService()
    Object.defineProperty(service, 'userService', {
      value: { getUserByAccountId: async () => ({ id: 'user-id' }) },
    })
    prisma.announcement.findMany.mockResolvedValueOnce([
      { id: 4, uuid: 'announcement-uuid', title: 'Notice', content: 'Body' },
    ])
    await expect(service.listVisibleAnnouncements('account-id')).resolves.toEqual([
      { uuid: 'announcement-uuid', title: 'Notice', content: 'Body' },
    ])
    expect(prisma.announcement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ announcement_dismiss: { none: { user_id: 'user-id' } } }),
        orderBy: [{ start_at: 'desc' }, { created_at: 'desc' }],
      }),
    )

    prisma.announcement.findMany.mockResolvedValueOnce([{ id: 4, uuid: 'announcement-uuid' }])
    await service.dismissAnnouncements('account-id', ['announcement-uuid', 'announcement-uuid'])
    expect(prisma.announcement_dismiss.createMany).toHaveBeenCalledWith({
      data: [{ announcement_id: 4, user_id: 'user-id' }],
      skipDuplicates: true,
    })
  })

  it('maps notification IDs and timestamps and keeps mark-as-read idempotent', async () => {
    const service = new UserNotificationService()
    prisma.user_notification.findMany.mockResolvedValue([
      {
        id: BigInt(9),
        type: 'CLUB_REGISTRATION_APPROVED',
        club_id: null,
        source_type: 'CLUB',
        source_id: 'club-id',
        metadata: null,
        read_at: null,
        created_at: new Date('2026-10-01T00:00:00Z'),
      },
    ])
    prisma.user_notification.count.mockResolvedValue(1)
    await expect(service.findByUser('user-id')).resolves.toEqual({
      unreadCount: 1,
      notifications: [
        {
          id: '9',
          type: 'CLUB_REGISTRATION_APPROVED',
          clubId: null,
          sourceType: 'CLUB',
          sourceId: 'club-id',
          metadata: null,
          readAt: null,
          createdAt: '2026-10-01T00:00:00.000Z',
        },
      ],
    })

    prisma.user_notification.updateMany.mockResolvedValue({ count: 0 })
    prisma.user_notification.findFirst
      .mockResolvedValueOnce({ id: BigInt(9) })
      .mockResolvedValueOnce(null)
    await expect(service.markAsRead('user-id', '9')).resolves.toBeUndefined()
    await expect(service.markAsRead('user-id', '9')).rejects.toBeInstanceOf(NotFoundError)
    expect(prisma.user_notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: BigInt(9), service_user_id: 'user-id', read_at: null },
      }),
    )
  })

  it('writes search logs without waiting for the insert', () => {
    prisma.user_activity_log.create.mockResolvedValue({ id: BigInt(1) })
    expect(new SearchLogService().logSearch('music')).toBeUndefined()
    expect(prisma.user_activity_log.create).toHaveBeenCalledWith({
      data: { type: 'CALL_SEARCH_CLUBS_API', params: '{"query":"music"}' },
    })
  })
})
