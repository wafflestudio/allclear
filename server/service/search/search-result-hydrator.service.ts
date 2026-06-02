import { Inject, Service } from 'server/provider'
import { ClubEntity } from 'server/infra/database/entities'
import { Club, toClubDomain } from 'server/domain/model/Club'
import { ClubService } from '../club.service'

@Service
export class SearchResultHydratorService {
  @Inject(ClubService)
  private readonly clubService: ClubService

  async toClubs(entities: ClubEntity[], serviceUserId: string | null = null): Promise<Club[]> {
    const uniqueEntities = this.dedupe(entities)
    if (uniqueEntities.length === 0) {
      return []
    }
    const uuids = uniqueEntities.map((it) => it.uuid)
    const [reviews, savedSet] = await Promise.all([
      this.clubService.getClubReviews(uuids),
      this.clubService.getSavedClubIdSet(serviceUserId, uuids),
    ])
    return uniqueEntities.map((it) => toClubDomain(it, reviews.get(it.uuid), savedSet.has(it.uuid)))
  }

  private dedupe(entities: ClubEntity[]): ClubEntity[] {
    return Array.from(new Map(entities.map((it) => [it.uuid, it])).values())
  }
}
