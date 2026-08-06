import { Repository } from 'typeorm'
import { Inject, InjectRepository, Service } from '../provider'
import { AnnouncementDismissEntity, AnnouncementEntity } from '../infra/database/entities'
import { UserService } from './user.service'
import { Announcement, toAnnouncementDomain } from '../domain/model/Announcement'
import { BadRequestError } from '../domain/error'

@Service
export class AnnouncementService {
  @InjectRepository(AnnouncementEntity)
  private readonly announcementRepository: Repository<AnnouncementEntity>
  @InjectRepository(AnnouncementDismissEntity)
  private readonly announcementDismissRepository: Repository<AnnouncementDismissEntity>
  @Inject(UserService)
  private readonly userService: UserService

  async listVisibleAnnouncements(accountId?: string | null): Promise<Announcement[]> {
    let dismissedAnnouncementIds: number[] = []

    if (accountId) {
      const user = await this.userService.getUserByAccountId(accountId)
      const dismisses = await this.announcementDismissRepository.findBy({
        userId: user.id,
      })
      dismissedAnnouncementIds = dismisses.map((dismiss) => dismiss.announcementId)
    }

    const query = this.announcementRepository
      .createQueryBuilder('announcement')
      .where('announcement.active = true')
      .andWhere('announcement.start_at <= NOW()')
      .andWhere('(announcement.end_at IS NULL OR announcement.end_at >= NOW())')
      .orderBy('announcement.start_at', 'DESC')
      .addOrderBy('announcement.created_at', 'DESC')

    if (dismissedAnnouncementIds.length > 0) {
      query.andWhere('announcement.id NOT IN (:...dismissedAnnouncementIds)', {
        dismissedAnnouncementIds,
      })
    }

    const entities = await query.getMany()
    return entities.map(toAnnouncementDomain)
  }

  async dismissAnnouncements(accountId: string, announcementUuids: string[]): Promise<void> {
    const user = await this.userService.getUserByAccountId(accountId)
    const uniqueAnnouncementUuids = [...new Set(announcementUuids)]

    const announcements = await this.announcementRepository.find({
      where: uniqueAnnouncementUuids.map((uuid) => ({
        uuid,
        active: true,
      })),
    })

    if (announcements.length !== uniqueAnnouncementUuids.length) {
      throw new BadRequestError('invalid announcement uuids')
    }

    if (announcements.length === 0) {
      return
    }

    await this.announcementDismissRepository
      .createQueryBuilder()
      .insert()
      .into(AnnouncementDismissEntity)
      .values(
        announcements.map((announcement) => ({
          announcementId: announcement.id,
          userId: user.id,
          dismissedAt: new Date().toISOString(),
        })),
      )
      .orIgnore()
      .execute()
  }
}
