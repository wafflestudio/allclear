import { BadRequestError } from '../domain/error'
import { type Announcement, toAnnouncementDomain } from '../domain/model/Announcement'
import { getPrismaClient } from '../infra/database/prisma'
import { Inject, Service } from '../provider'
import { UserService } from './user.service'

@Service
export class AnnouncementService {
  @Inject(UserService)
  private readonly userService: UserService

  async listVisibleAnnouncements(accountId?: string | null): Promise<Announcement[]> {
    let userId: string | undefined

    if (accountId) {
      const user = await this.userService.getUserByAccountId(accountId)
      userId = user.id
    }

    const now = new Date()
    const announcements = await getPrismaClient().announcement.findMany({
      where: {
        active: true,
        start_at: { lte: now },
        OR: [{ end_at: null }, { end_at: { gte: now } }],
        ...(userId ? { announcement_dismiss: { none: { user_id: userId } } } : {}),
      },
      orderBy: [{ start_at: 'desc' }, { created_at: 'desc' }],
    })
    return announcements.map(toAnnouncementDomain)
  }

  async dismissAnnouncements(accountId: string, announcementUuids: string[]): Promise<void> {
    const user = await this.userService.getUserByAccountId(accountId)
    const uniqueAnnouncementUuids = [...new Set(announcementUuids)]

    const prisma = getPrismaClient()
    const announcements = await prisma.announcement.findMany({
      where: { uuid: { in: uniqueAnnouncementUuids }, active: true },
    })

    if (announcements.length !== uniqueAnnouncementUuids.length) {
      throw new BadRequestError('invalid announcement uuids')
    }

    if (announcements.length === 0) {
      return
    }

    await prisma.announcement_dismiss.createMany({
      data: announcements.map((announcement) => ({
        announcement_id: announcement.id,
        user_id: user.id,
      })),
      skipDuplicates: true,
    })
  }
}
