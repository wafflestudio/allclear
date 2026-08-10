import { MAX_OFFICIAL_VERIFICATION_RETRY_COUNT } from 'src/common/constants/official-verification-status'
import type { Repository } from 'typeorm'
import { ConflictError, ForbiddenError, NotFoundError } from '../domain/error'
import { ClubEntity } from '../infra/database/entities'
import { ClubManagerEntity } from '../infra/database/entities/club-manager.entity'
import { ClubVerificationRequestEntity } from '../infra/database/entities/club-verification-request.entity'
import { InjectRepository, Service } from '../provider'

const MAX_OFFICIAL_VERIFICATION_ATTEMPT_COUNT = MAX_OFFICIAL_VERIFICATION_RETRY_COUNT + 1

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
    const manager = await this.clubManagerRepository.findOneBy({ clubId: clubUuid, serviceUserId })
    if (!manager) {
      throw new ForbiddenError('not a manager of this club')
    }

    return this.clubRepository.manager.transaction(async (transactionManager) => {
      const club = await transactionManager
        .getRepository(ClubEntity)
        .createQueryBuilder('club')
        .setLock('pessimistic_write')
        .where('club.uuid = :clubUuid', { clubUuid })
        .andWhere('club.deleted_at IS NULL')
        .getOne()
      if (!club) {
        throw new NotFoundError('club not found')
      }

      if (club.isOfficialVerified) {
        throw new ConflictError('club is already officially verified')
      }

      const verificationRequestRepository = transactionManager.getRepository(
        ClubVerificationRequestEntity,
      )
      const pendingRequest = await verificationRequestRepository.findOneBy({
        clubId: clubUuid,
        status: 'PENDING',
      })
      if (pendingRequest) {
        throw new ConflictError('pending verification request already exists')
      }

      const attemptCount = await verificationRequestRepository.countBy({ clubId: clubUuid })
      if (attemptCount >= MAX_OFFICIAL_VERIFICATION_ATTEMPT_COUNT) {
        throw new ConflictError('official verification retry limit exceeded')
      }

      const request = verificationRequestRepository.create({
        clubId: clubUuid,
        attemptNo: attemptCount + 1,
      })
      return verificationRequestRepository.save(request)
    })
  }
}
