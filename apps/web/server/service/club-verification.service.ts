import { IsNull, Repository } from 'typeorm'
import { InjectRepository, Service } from '../provider'
import { ClubEntity } from '../infra/database/entities'
import { ClubManagerEntity } from '../infra/database/entities/club-manager.entity'
import { ClubVerificationRequestEntity } from '../infra/database/entities/club-verification-request.entity'
import { ConflictError, ForbiddenError, NotFoundError } from '../domain/error'

@Service
export class ClubVerificationService {
  @InjectRepository(ClubEntity)
  private readonly clubRepository: Repository<ClubEntity>

  @InjectRepository(ClubManagerEntity)
  private readonly clubManagerRepository: Repository<ClubManagerEntity>

  @InjectRepository(ClubVerificationRequestEntity)
  private readonly clubVerificationRequestRepository: Repository<ClubVerificationRequestEntity>

  async requestVerification(
    clubUuid: string,
    serviceUserId: string,
  ): Promise<ClubVerificationRequestEntity> {
    const club = await this.clubRepository.findOneBy({ uuid: clubUuid, deletedAt: IsNull() })
    if (!club) {
      throw new NotFoundError('club not found')
    }

    const manager = await this.clubManagerRepository.findOneBy({ clubId: clubUuid, serviceUserId })
    if (!manager) {
      throw new ForbiddenError('not a manager of this club')
    }

    if (club.isOfficialVerified) {
      throw new ConflictError('club is already officially verified')
    }

    const pendingRequest = await this.clubVerificationRequestRepository.findOneBy({
      clubId: clubUuid,
      status: 'PENDING',
    })
    if (pendingRequest) {
      throw new ConflictError('pending verification request already exists')
    }

    const request = this.clubVerificationRequestRepository.create({ clubId: clubUuid })
    return this.clubVerificationRequestRepository.save(request)
  }
}
