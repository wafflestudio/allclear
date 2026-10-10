import { MAX_OFFICIAL_VERIFICATION_RETRY_COUNT } from 'server/domain/constants/official-verification-status'
import { getOfficialVerificationTermKey } from 'server/domain/constants/official-verification-term'
import { ConflictError, ForbiddenError, NotFoundError } from '../domain/error'
import type { club_verification_request } from '../infra/database/generated/prisma/client'
import { getPrismaClient } from '../infra/database/prisma'
import { toDatabaseIdString, toTimestampString } from '../infra/database/prisma-mapping'
import { Service } from '../provider'

const MAX_OFFICIAL_VERIFICATION_ATTEMPT_COUNT = MAX_OFFICIAL_VERIFICATION_RETRY_COUNT + 1

type VerificationRequestResult = {
  id: string
  clubId: string
  createdAt: string
  attemptNo: number
}

@Service
export class ClubVerificationService {
  async requestVerification(
    clubUuid: string,
    serviceUserId: string,
  ): Promise<VerificationRequestResult> {
    const prisma = getPrismaClient()
    const manager = await prisma.club_manager.findFirst({
      where: { club_id: clubUuid, service_user_id: serviceUserId, deleted_at: null },
      select: { id: true },
    })
    if (!manager) {
      throw new ForbiddenError('not a manager of this club')
    }

    return prisma.$transaction(async (tx) => {
      // Serialize requests for the same club before reading its verification state.
      const clubs = await tx.$queryRaw<Array<{ uuid: string; is_official_verified: boolean }>>`
        SELECT uuid, is_official_verified FROM club
        WHERE uuid = ${clubUuid}::uuid AND deleted_at IS NULL
        FOR UPDATE
      `
      const club = clubs[0]
      if (!club) {
        throw new NotFoundError('club not found')
      }
      if (club.is_official_verified) {
        throw new ConflictError('club is already officially verified')
      }

      const termKey = getOfficialVerificationTermKey()
      const existing = await tx.club_verification_request.findUnique({
        where: { club_id: clubUuid },
      })
      if (existing?.status === 'PENDING') {
        throw new ConflictError('pending verification request already exists')
      }

      let request: club_verification_request
      if (!existing) {
        request = await tx.club_verification_request.create({
          data: { club_id: clubUuid, term_key: termKey, attempt_no: 1 },
        })
      } else {
        const attemptNo =
          existing.term_key !== termKey
            ? existing.status === 'REJECTED'
              ? 2
              : 1
            : existing.attempt_no + 1
        if (
          existing.term_key === termKey &&
          existing.attempt_no >= MAX_OFFICIAL_VERIFICATION_ATTEMPT_COUNT
        ) {
          throw new ConflictError('official verification retry limit exceeded')
        }
        request = await tx.club_verification_request.update({
          where: { id: existing.id },
          data: {
            term_key: termKey,
            attempt_no: attemptNo,
            status: 'PENDING',
            reject_reason: null,
            created_at: new Date(),
          },
        })
      }

      return {
        id: toDatabaseIdString(request.id),
        clubId: request.club_id,
        createdAt: toTimestampString(request.created_at),
        attemptNo: request.attempt_no,
      }
    })
  }
}
