import { toClubDomain } from 'server/domain/model/Club'
import type { club as PrismaClub } from 'server/infra/database/generated/prisma/client'
import { getPrismaClient } from 'server/infra/database/prisma'
import { Inject, Service } from 'server/provider'
import { ClubService } from '../club.service'
import type { SearchClub } from './search.types'
import { toClubDomainSources } from './search-club-source'

@Service
export class SearchResultHydratorService {
  @Inject(ClubService)
  private readonly clubService: ClubService

  // 찾은 동아리에 학과, 후기, 관리자 유무를 붙여 화면에 보일 모양으로 만듭니다.
  async toClubs(found: PrismaClub[]): Promise<SearchClub[]> {
    const clubs = this.dedupe(found)
    if (clubs.length === 0) {
      return []
    }
    const clubIds = clubs.map((club) => club.uuid)

    // 세 가지를 함께 읽습니다. 서로를 기다리지 않습니다.
    const [sources, reviews, managers] = await Promise.all([
      toClubDomainSources(clubs),
      this.clubService.getClubReviews(clubIds),
      getPrismaClient().club_manager.findMany({
        select: { club_id: true },
        where: { club_id: { in: clubIds }, deleted_at: null },
      }),
    ])
    const managedClubIds = new Set(managers.map((manager) => manager.club_id))

    return sources.map((source) => ({
      ...toClubDomain(source, reviews.get(source.uuid)),
      hasManager: managedClubIds.has(source.uuid),
    }))
  }

  private dedupe(clubs: PrismaClub[]): PrismaClub[] {
    return Array.from(new Map(clubs.map((club) => [club.uuid, club])).values())
  }
}
