import { In, Repository } from 'typeorm'
import { Inject, InjectRepository, Service } from 'server/provider'
import { ClubEntity, ClubManagerEntity } from 'server/infra/database/entities'
import { toClubDomain } from 'server/domain/model/Club'
import { ClubService } from '../club.service'
import { SearchClub } from './search.types'

@Service
export class SearchResultHydratorService {
  @Inject(ClubService)
  private readonly clubService: ClubService

  @InjectRepository(ClubManagerEntity)
  private readonly clubManagerRepository: Repository<ClubManagerEntity>

  async toClubs(entities: ClubEntity[]): Promise<SearchClub[]> {
    const uniqueEntities = this.dedupe(entities)
    if (uniqueEntities.length === 0) {
      return []
    }
    const clubIds = uniqueEntities.map((it) => it.uuid)
    const [reviews, managers] = await Promise.all([
      this.clubService.getClubReviews(clubIds),
      this.clubManagerRepository.find({
        select: { clubId: true },
        where: { clubId: In(clubIds) },
      }),
    ])
    const managedClubIds = new Set(managers.map((it) => it.clubId))

    return uniqueEntities.map((it) => ({
      ...toClubDomain(it, reviews.get(it.uuid)),
      hasManager: managedClubIds.has(it.uuid),
    }))
  }

  private dedupe(entities: ClubEntity[]): ClubEntity[] {
    return Array.from(new Map(entities.map((it) => [it.uuid, it])).values())
  }
}
