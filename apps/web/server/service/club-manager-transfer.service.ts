import { createHash, randomBytes } from 'node:crypto'
import type { User } from 'server/domain/model/User'
import { ENV } from 'server/ENV'
import { ConflictError, ForbiddenError, NotFoundError } from '../domain/error'
import {
  type club_manager_transfer_invitation,
  Prisma,
} from '../infra/database/generated/prisma/client'
import { getPrismaClient } from '../infra/database/prisma'
import { toTimestampString } from '../infra/database/prisma-mapping'
import { Service } from '../provider'
import { getSafeDatabaseErrorContext } from '../util/safe-error'

const MANAGER_TRANSFER_CONFLICT_CONSTRAINTS = new Set([
  'uq_club_manager_active_club',
  'club_manager_clubid_serviceuserid',
])

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
  async createInvitation(
    clubUuid: string,
    senderServiceUserId: string,
  ): Promise<{ transfer_url: string; expires_at: string }> {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + INVITATION_TTL_MS)
    const rawToken = randomBytes(32).toString('base64url')

    await getPrismaClient().$transaction(
      async (tx) => {
        const managers = await tx.$queryRaw<Array<{ id: number }>>`
        SELECT id FROM club_manager
        WHERE club_id = ${clubUuid}::uuid
          AND service_user_id = ${senderServiceUserId}::uuid
          AND deleted_at IS NULL
        FOR UPDATE
      `
        if (managers.length === 0) {
          throw new ForbiddenError('not a manager of this club')
        }

        await tx.club_manager_transfer_invitation.updateMany({
          where: { club_id: clubUuid, revoked_at: null, accepted_at: null },
          data: { revoked_at: now },
        })
        await tx.club_manager_transfer_invitation.create({
          data: {
            club_id: clubUuid,
            sender_service_user_id: senderServiceUserId,
            token_hash: hashManagerTransferToken(rawToken),
            expires_at: expiresAt,
          },
        })
      },
      { timeout: 30_000 },
    )

    return {
      transfer_url: new URL(`/manager-transfer/${rawToken}`, ENV.HOST).toString(),
      expires_at: toTimestampString(expiresAt),
    }
  }

  async getInvitation(rawToken: string): Promise<ManagerTransferInvitationResponse> {
    const prisma = getPrismaClient()
    const invitation = await prisma.club_manager_transfer_invitation.findUnique({
      where: { token_hash: hashManagerTransferToken(rawToken) },
    })
    if (!invitation || !this.isActive(invitation)) {
      throw new NotFoundError('manager transfer invitation not found')
    }

    const club = await prisma.club.findFirst({
      where: { uuid: invitation.club_id, deleted_at: null },
      select: { uuid: true, name: true },
    })
    if (!club) {
      throw new NotFoundError('manager transfer invitation not found')
    }

    return {
      club_uuid: club.uuid,
      club_name: club.name,
      expires_at: toTimestampString(invitation.expires_at),
    }
  }

  async acceptInvitation(
    rawToken: string,
    recipient: User,
  ): Promise<ManagerTransferAcceptanceResponse> {
    const acceptance = getPrismaClient().$transaction(
      async (tx) => {
        const candidate = await tx.club_manager_transfer_invitation.findUnique({
          where: { token_hash: hashManagerTransferToken(rawToken) },
        })
        if (!candidate) {
          throw new NotFoundError('manager transfer invitation not found')
        }

        if (candidate.accepted_at) {
          if (candidate.accepted_by_service_user_id !== recipient.serviceUserId) {
            throw new NotFoundError('manager transfer invitation not found')
          }
          return this.getClubAcceptanceResponse(tx, candidate.club_id)
        }
        if (!this.isActive(candidate)) {
          throw new NotFoundError('manager transfer invitation not found')
        }
        if (candidate.sender_service_user_id === recipient.serviceUserId) {
          throw new ConflictError('cannot transfer club management to yourself')
        }

        const managers = await tx.$queryRaw<Array<{ id: number }>>`
        SELECT id FROM club_manager
        WHERE club_id = ${candidate.club_id}::uuid
          AND service_user_id = ${candidate.sender_service_user_id}::uuid
          AND deleted_at IS NULL
        FOR UPDATE
      `
        const manager = managers[0]
        if (!manager) {
          // Re-read after waiting for the manager row so a repeat by the same
          // recipient can return the already committed acceptance result.
          const completedInvitation = await tx.club_manager_transfer_invitation.findUnique({
            where: { id: candidate.id },
          })
          if (
            completedInvitation?.accepted_at &&
            completedInvitation.accepted_by_service_user_id === recipient.serviceUserId
          ) {
            return this.getClubAcceptanceResponse(tx, completedInvitation.club_id)
          }
          throw new NotFoundError('manager transfer invitation not found')
        }

        // Creation and acceptance both lock manager before invitation.
        const lockedInvitations = await tx.$queryRaw<Array<{ id: bigint }>>`
        SELECT id FROM club_manager_transfer_invitation
        WHERE id = ${candidate.id}
        FOR UPDATE
      `
        if (lockedInvitations.length === 0) {
          throw new NotFoundError('manager transfer invitation not found')
        }
        const invitation = await tx.club_manager_transfer_invitation.findUnique({
          where: { id: candidate.id },
        })
        if (!invitation) {
          throw new NotFoundError('manager transfer invitation not found')
        }
        if (invitation.accepted_at) {
          if (invitation.accepted_by_service_user_id !== recipient.serviceUserId) {
            throw new NotFoundError('manager transfer invitation not found')
          }
          return this.getClubAcceptanceResponse(tx, invitation.club_id)
        }
        if (!this.isActive(invitation)) {
          throw new NotFoundError('manager transfer invitation not found')
        }

        const club = await this.getClubAcceptanceResponse(tx, invitation.club_id)
        const acceptedAt = new Date()

        await tx.club_manager.update({
          where: { id: manager.id },
          data: { deleted_at: acceptedAt, updated_at: acceptedAt },
        })
        await tx.club_manager.create({
          data: {
            club_id: invitation.club_id,
            service_user_id: recipient.serviceUserId,
            name: recipient.name,
            phone: recipient.phone,
            student_id: getAdmissionClassLabel(recipient.admissionClass),
          },
        })
        await tx.club_manager_transfer_invitation.update({
          where: { id: invitation.id },
          data: {
            accepted_by_service_user_id: recipient.serviceUserId,
            accepted_at: acceptedAt,
          },
        })
        await tx.user_notification.create({
          data: {
            service_user_id: invitation.sender_service_user_id,
            type: 'MANAGER_TRANSFER_COMPLETED',
            club_id: invitation.club_id,
            source_type: 'MANAGER_TRANSFER',
            source_id: String(invitation.id),
            metadata: { clubName: club.club_name },
          },
        })

        return club
      },
      { timeout: 30_000 },
    )
    return this.withPersistenceConflictMapping(acceptance)
  }

  private async withPersistenceConflictMapping<T>(operation: Promise<T>): Promise<T> {
    try {
      return await operation
    } catch (error) {
      const { databaseCode, prismaCode, constraint } = getSafeDatabaseErrorContext(error)
      const knownConstraint = constraint && MANAGER_TRANSFER_CONFLICT_CONSTRAINTS.has(constraint)
      const prismaManagerTarget =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002' &&
        Array.isArray(error.meta?.target) &&
        (error.meta.target.join(',') === 'club_id' ||
          error.meta.target.join(',') === 'club_id,service_user_id')
      if (
        ((databaseCode === '23505' || prismaCode === 'P2002') && knownConstraint) ||
        prismaManagerTarget
      ) {
        throw new ConflictError('manager transfer state conflict')
      }
      throw error
    }
  }

  private isActive(invitation: club_manager_transfer_invitation): boolean {
    return (
      invitation.revoked_at == null &&
      invitation.accepted_at == null &&
      invitation.expires_at.getTime() > Date.now()
    )
  }

  private async getClubAcceptanceResponse(
    tx: Prisma.TransactionClient,
    clubUuid: string,
  ): Promise<ManagerTransferAcceptanceResponse> {
    const club = await tx.club.findFirst({
      where: { uuid: clubUuid, deleted_at: null },
      select: { uuid: true, name: true },
    })
    if (!club) {
      throw new NotFoundError('manager transfer invitation not found')
    }
    return { club_uuid: club.uuid, club_name: club.name }
  }
}
