import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prisma } = vi.hoisted(() => ({
  prisma: {
    user_activity_log: { create: vi.fn() },
    club_manager: { findFirst: vi.fn(), create: vi.fn() },
  },
}))

vi.mock('../provider', () => ({
  Inject: () => () => undefined,
  InjectRepository: () => () => undefined,
  Service: () => undefined,
}))
vi.mock('../infra/database/prisma', () => ({ getPrismaClient: () => prisma }))

import { ClubService } from './club.service'

const clubUuid = '123e4567-e89b-12d3-a456-426614174000'
const serviceUserId = '123e4567-e89b-12d3-a456-426614174001'

beforeEach(() => {
  vi.resetAllMocks()
  prisma.user_activity_log.create.mockResolvedValue({ id: BigInt(1) })
  prisma.club_manager.findFirst.mockResolvedValue(null)
})

describe('ClubService remaining Prisma methods', () => {
  it('writes category activity without waiting for the log result', async () => {
    const categories = await new ClubService().getCategories()

    expect(categories.length).toBeGreaterThan(0)
    expect(prisma.user_activity_log.create).toHaveBeenCalledWith({
      data: { type: 'CALL_GET_CATEGORY_LIST_API', params: '{}' },
    })
  })

  it('checks club existence before registering an active manager', async () => {
    const service = new ClubService()
    const getExistingClub = vi.fn().mockResolvedValue({ uuid: clubUuid })
    Object.defineProperty(service, 'clubAccessService', { value: { getExistingClub } })

    await service.registerClubManager(serviceUserId, clubUuid)

    expect(getExistingClub).toHaveBeenCalledWith(clubUuid)
    expect(prisma.club_manager.findFirst).toHaveBeenCalledWith({
      where: { service_user_id: serviceUserId, club_id: clubUuid, deleted_at: null },
      select: { id: true },
    })
    expect(prisma.club_manager.create).toHaveBeenCalledWith({
      data: { service_user_id: serviceUserId, club_id: clubUuid },
    })
  })

  it('does not add a duplicate active manager', async () => {
    prisma.club_manager.findFirst.mockResolvedValue({ id: 1 })
    const service = new ClubService()
    Object.defineProperty(service, 'clubAccessService', {
      value: { getExistingClub: vi.fn().mockResolvedValue({ uuid: clubUuid }) },
    })

    await service.registerClubManager(serviceUserId, clubUuid)

    expect(prisma.club_manager.create).not.toHaveBeenCalled()
  })
})
