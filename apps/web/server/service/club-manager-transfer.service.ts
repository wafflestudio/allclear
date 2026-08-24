import { createHash, randomBytes } from 'node:crypto'
import type { User } from 'server/domain/model/User'
import { ENV } from 'server/ENV'
import { IsNull, type Repository } from 'typeorm'
import { ConflictError, ForbiddenError, NotFoundError } from '../domain/error'
import {
  ClubEntity,
  ClubManagerEntity,
  ClubManagerTransferInvitationEntity,
  UserNotificationEntity,
} from '../infra/database/entities'
import { InjectRepository, Service } from '../provider'

const INVITATION_TTL_MS = 72 * 60 * 60 * 1000

type ManagerTransferInvitationResponse = {
  club_uuid: string
  club_name: string
  expires_at: string
}

type ManagerTransferAcceptanceResponse = {
  club_uuid: string
  club_name: string
}

export const hashManagerTransferToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex')

const getAdmissionClassLabel = (admissionClass: number | null): string =>
  admissionClass == null ? '' : `${String(admissionClass).padStart(2, '0')}학번`

@Service
export class ClubManagerTransferService {
  @InjectRepository(ClubManagerTransferInvitationEntity)
  private readonly invitationRepository: Repository<ClubManagerTransferInvitationEntity>

  @InjectRepository(ClubEntity)
  private readonly clubRepository: Repository<ClubEntity>

  async createInvitation(
    clubUuid: string,
    senderServiceUserId: string,
  ): Promise<{ transfer_url: string; expires_at: string }> {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + INVITATION_TTL_MS).toISOString()
    const rawToken = randomBytes(32).toString('base64url')

    await this.invitationRepository.manager.transaction(async (transactionManager) => {
      const clubManagerRepository = transactionManager.getRepository(ClubManagerEntity)
      const invitationRepository = transactionManager.getRepository(
        ClubManagerTransferInvitationEntity,
      )
      const clubManager = await clubManagerRepository.findOne({
        where: { clubId: clubUuid, serviceUserId: senderServiceUserId },
        lock: { mode: 'pessimistic_write' },
      })
      if (!clubManager) {
        throw new ForbiddenError('not a manager of this club')
      }

      await invitationRepository.update(
        {
          clubId: clubUuid,
          revokedAt: IsNull(),
          acceptedAt: IsNull(),
        },
        { revokedAt: now.toISOString() },
      )
      const invitation = invitationRepository.create({
        clubId: clubUuid,
        senderServiceUserId,
        tokenHash: hashManagerTransferToken(rawToken),
        expiresAt,
        revokedAt: null,
        acceptedByServiceUserId: null,
        acceptedAt: null,
      })
      await invitationRepository.save(invitation)
    })

    return {
      transfer_url: new URL(`/manager-transfer/${rawToken}`, ENV.HOST).toString(),
      expires_at: expiresAt,
    }
  }

  async getInvitation(rawToken: string): Promise<ManagerTransferInvitationResponse> {
    const invitation = await this.invitationRepository.findOneBy({
      tokenHash: hashManagerTransferToken(rawToken),
    })
    if (!invitation || !this.isActive(invitation)) {
      throw new NotFoundError('manager transfer invitation not found')
    }

    const club = await this.clubRepository.findOneBy({
      uuid: invitation.clubId,
      deletedAt: IsNull(),
    })
    if (!club) {
      throw new NotFoundError('manager transfer invitation not found')
    }

    return {
      club_uuid: club.uuid,
      club_name: club.name,
      expires_at: invitation.expiresAt,
    }
  }

  async acceptInvitation(
    rawToken: string,
    recipient: User,
  ): Promise<ManagerTransferAcceptanceResponse> {
    return this.invitationRepository.manager.transaction(async (transactionManager) => {
      const invitationRepository = transactionManager.getRepository(
        ClubManagerTransferInvitationEntity,
      )
      const clubManagerRepository = transactionManager.getRepository(ClubManagerEntity)
      const clubRepository = transactionManager.getRepository(ClubEntity)
      const notificationRepository = transactionManager.getRepository(UserNotificationEntity)
      const candidate = await invitationRepository.findOne({
        where: { tokenHash: hashManagerTransferToken(rawToken) },
      })
      if (!candidate) {
        throw new NotFoundError('manager transfer invitation not found')
      }

      if (candidate.acceptedAt) {
        if (candidate.acceptedByServiceUserId !== recipient.serviceUserId) {
          throw new NotFoundError('manager transfer invitation not found')
        }
        return this.getClubAcceptanceResponse(clubRepository, candidate.clubId)
      }
      if (!this.isActive(candidate)) {
        throw new NotFoundError('manager transfer invitation not found')
      }
      if (candidate.senderServiceUserId === recipient.serviceUserId) {
        throw new ConflictError('cannot transfer club management to yourself')
      }

      const clubManager = await clubManagerRepository.findOne({
        where: {
          clubId: candidate.clubId,
          serviceUserId: candidate.senderServiceUserId,
        },
        lock: { mode: 'pessimistic_write' },
      })
      if (!clubManager) {
        // A concurrent request from the same recipient may have committed while
        // this SELECT waited for the old manager row. Re-read the immutable
        // acceptance result before treating the invitation as unavailable.
        const completedInvitation = await invitationRepository.findOne({
          where: { id: candidate.id },
        })
        if (
          completedInvitation?.acceptedAt &&
          completedInvitation.acceptedByServiceUserId === recipient.serviceUserId
        ) {
          return this.getClubAcceptanceResponse(clubRepository, completedInvitation.clubId)
        }
        throw new NotFoundError('manager transfer invitation not found')
      }

      // Reissue and acceptance both lock manager -> invitation. Keeping that order
      // prevents the two transactions from deadlocking when they race.
      const invitation = await invitationRepository.findOne({
        where: { id: candidate.id },
        lock: { mode: 'pessimistic_write' },
      })
      if (!invitation) {
        throw new NotFoundError('manager transfer invitation not found')
      }
      if (invitation.acceptedAt) {
        if (invitation.acceptedByServiceUserId !== recipient.serviceUserId) {
          throw new NotFoundError('manager transfer invitation not found')
        }
        return this.getClubAcceptanceResponse(clubRepository, invitation.clubId)
      }
      if (!this.isActive(invitation)) {
        throw new NotFoundError('manager transfer invitation not found')
      }

      const club = await this.getClubAcceptanceResponse(clubRepository, invitation.clubId)
      const acceptedAt = new Date().toISOString()

      await clubManagerRepository.softDelete({ id: clubManager.id })
      await clubManagerRepository.insert({
        clubId: invitation.clubId,
        serviceUserId: recipient.serviceUserId,
        name: recipient.name,
        phone: recipient.phone,
        studentId: getAdmissionClassLabel(recipient.admissionClass),
      })
      await invitationRepository.update(
        { id: invitation.id },
        {
          acceptedByServiceUserId: recipient.serviceUserId,
          acceptedAt,
        },
      )
      await notificationRepository.insert({
        serviceUserId: invitation.senderServiceUserId,
        type: 'MANAGER_TRANSFER_COMPLETED',
        clubId: invitation.clubId,
        sourceType: 'MANAGER_TRANSFER',
        sourceId: invitation.id,
        metadata: { clubName: club.club_name },
      })

      return club
    })
  }

  private isActive(invitation: ClubManagerTransferInvitationEntity): boolean {
    return (
      invitation.revokedAt == null &&
      invitation.acceptedAt == null &&
      new Date(invitation.expiresAt).getTime() > Date.now()
    )
  }

  private async getClubAcceptanceResponse(
    clubRepository: Repository<ClubEntity>,
    clubUuid: string,
  ): Promise<ManagerTransferAcceptanceResponse> {
    const club = await clubRepository.findOneBy({ uuid: clubUuid, deletedAt: IsNull() })
    if (!club) {
      throw new NotFoundError('manager transfer invitation not found')
    }
    return { club_uuid: club.uuid, club_name: club.name }
  }
}
