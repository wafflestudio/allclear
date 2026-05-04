import { IsNull, Repository } from 'typeorm'
import { ClubEntity } from '../infra/database/entities'
import { ClubManagerEntity } from '../infra/database/entities/club-manager.entity'
import { ForbiddenError, NotFoundError } from '../domain/error'
import { InjectRepository, Service } from '../provider'
import { PUBLIC_CLUB_STATUS } from 'src/common/constants/club-status'

@Service
export class ClubAccessService {
  @InjectRepository(ClubEntity)
  private readonly clubRepository: Repository<ClubEntity>
  @InjectRepository(ClubManagerEntity)
  private readonly clubManagerRepository: Repository<ClubManagerEntity>

  async getExistingClub(clubUuid: string): Promise<ClubEntity> {
    const club = await this.clubRepository.findOneBy({
      uuid: clubUuid,
      deletedAt: IsNull(),
    })
    if (!club) {
      throw new NotFoundError('club not found')
    }
    return club
  }

  async getPublicClub(clubUuid: string): Promise<ClubEntity> {
    const club = await this.clubRepository.findOneBy({
      uuid: clubUuid,
      status: PUBLIC_CLUB_STATUS,
      deletedAt: IsNull(),
    })
    if (!club) {
      throw new NotFoundError('club not found')
    }
    return club
  }

  async assertManagedClub(clubUuid: string, serviceUserId: string): Promise<void> {
    const [club, clubManager] = await Promise.all([
      this.clubRepository.findOneBy({ uuid: clubUuid, deletedAt: IsNull() }),
      this.clubManagerRepository.findOneBy({ clubId: clubUuid, serviceUserId }),
    ])
    if (!club) {
      throw new NotFoundError('club not found')
    }
    if (!clubManager) {
      throw new ForbiddenError('not a manager of this club')
    }
  }
}
