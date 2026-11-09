import { PUBLIC_CLUB_STATUS } from 'server/domain/constants/club-status'
import { ForbiddenError, NotFoundError } from '../domain/error'
import type { ClubDomainSource } from '../domain/model/Club'
import { getPrismaClient } from '../infra/database/prisma'
import { toClubDomainSource } from '../infra/database/prisma-club-mapping'
import { Service } from '../provider'

@Service
export class ClubAccessService {
  async getExistingClub(clubUuid: string): Promise<ClubDomainSource> {
    return this.getClub(clubUuid)
  }

  async getPublicClub(clubUuid: string): Promise<ClubDomainSource> {
    return this.getClub(clubUuid, PUBLIC_CLUB_STATUS)
  }

  async assertManagedClub(clubUuid: string, serviceUserId: string): Promise<void> {
    const prisma = getPrismaClient()
    const [club, clubManager] = await Promise.all([
      prisma.club.findFirst({
        where: { uuid: clubUuid, deleted_at: null },
        select: { uuid: true },
      }),
      prisma.club_manager.findFirst({
        where: { club_id: clubUuid, service_user_id: serviceUserId, deleted_at: null },
        select: { id: true },
      }),
    ])
    if (!club) {
      throw new NotFoundError('club not found')
    }
    if (!clubManager) {
      throw new ForbiddenError('not a manager of this club')
    }
  }

  private async getClub(clubUuid: string, status?: string): Promise<ClubDomainSource> {
    const prisma = getPrismaClient()
    const club = await prisma.club.findFirst({
      where: { uuid: clubUuid, deleted_at: null, ...(status && { status }) },
    })
    if (!club) {
      throw new NotFoundError('club not found')
    }

    const collegeMajor =
      club.college_major_id === null
        ? null
        : await prisma.college_major.findFirst({
            where: { id: club.college_major_id, deleted_at: null },
            select: { id: true, college: true, major: true },
          })
    return toClubDomainSource(club, collegeMajor)
  }
}
