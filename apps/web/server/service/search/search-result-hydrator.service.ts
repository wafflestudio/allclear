import { toClubDomain } from 'server/domain/model/Club'
import type { ClubEntity } from 'server/infra/database/entities'
import { getPrismaClient } from 'server/infra/database/prisma'
import { Inject, Service } from 'server/provider'
import { ClubService } from '../club.service'
import type { SearchClub } from './search.types'

@Service
export class SearchResultHydratorService {
  @Inject(ClubService)
  private readonly clubService: ClubService

  async toClubs(entities: ClubEntity[]): Promise<SearchClub[]> {
    const uniqueEntities = this.dedupe(entities)
    if (uniqueEntities.length === 0) {
      return []
    }
    const clubIds = uniqueEntities.map((it) => it.uuid)
    const [reviews, managers] = await Promise.all([
      this.clubService.getClubReviews(clubIds),
      getPrismaClient().club_manager.findMany({
        select: { club_id: true },
        where: { club_id: { in: clubIds }, deleted_at: null },
      }),
    ])
    const managedClubIds = new Set(managers.map((it) => it.club_id))

    return uniqueEntities.map((it) => ({
      ...toClubDomain(it, reviews.get(it.uuid)),
      hasManager: managedClubIds.has(it.uuid),
    }))
  }

  private dedupe(entities: ClubEntity[]): ClubEntity[] {
    return Array.from(new Map(entities.map((it) => [it.uuid, it])).values())
  }
}
