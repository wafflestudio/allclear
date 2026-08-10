import { MAX_OFFICIAL_VERIFICATION_RETRY_COUNT } from 'src/common/constants/official-verification-status'
import { getOfficialVerificationTermKey } from 'src/common/constants/official-verification-term'
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
      const termKey = getOfficialVerificationTermKey()
      const verificationRequest = await verificationRequestRepository.findOneBy({
        clubId: clubUuid,
      })

      if (!verificationRequest) {
        const request = verificationRequestRepository.create({
          clubId: clubUuid,
          termKey,
          attemptNo: 1,
        })
        return verificationRequestRepository.save(request)
      }

      if (verificationRequest.termKey !== termKey) {
        verificationRequest.termKey = termKey
        verificationRequest.attemptNo = 1
        verificationRequest.status = 'PENDING'
        verificationRequest.rejectReason = null
        verificationRequest.createdAt = new Date().toISOString()
        return verificationRequestRepository.save(verificationRequest)
      }

      if (verificationRequest.status === 'PENDING') {
        throw new ConflictError('pending verification request already exists')
      }

      if (verificationRequest.attemptNo >= MAX_OFFICIAL_VERIFICATION_ATTEMPT_COUNT) {
        throw new ConflictError('official verification retry limit exceeded')
      }

      verificationRequest.attemptNo += 1
      verificationRequest.status = 'PENDING'
      verificationRequest.rejectReason = null
      verificationRequest.createdAt = new Date().toISOString()
      return verificationRequestRepository.save(verificationRequest)
    })
  }
}
