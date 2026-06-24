import { FindOptionsWhere, ILike, IsNull, Repository, SelectQueryBuilder } from 'typeorm'
import { InjectRepository, Service } from 'server/provider'
import { ClubEntity } from 'server/infra/database/entities'
import { CollegeMajorEntity } from 'server/infra/database/entities/college-major.entity'
import { PUBLIC_CLUB_STATUS } from 'src/common/constants/club-status'
import { applySearchFilters } from './search-filter'
import { SearchFilters } from './search.types'

@Service
export class SearchQueryService {
  @InjectRepository(ClubEntity)
  private readonly clubRepository: Repository<ClubEntity>

  @InjectRepository(CollegeMajorEntity)
  private readonly collegeMajorRepository: Repository<CollegeMajorEntity>

  async search(query: string, filters: SearchFilters = {}): Promise<ClubEntity[]> {
    const [textMatchedEntities, collegeMajorMatchedEntities] = await Promise.all([
      this.findByText(query, filters),
      this.findByCollegeMajor(query, filters),
    ])

    return this.dedupe([...textMatchedEntities, ...collegeMajorMatchedEntities])
  }

  private findByText(query: string, filters: SearchFilters): Promise<ClubEntity[]> {
    const qb = this.buildBaseQuery()
    qb.andWhere('(club.name ILIKE :query OR club.short_description ILIKE :query)', {
      query: `%${query}%`,
    })

    applySearchFilters(qb, filters)
    return qb.getMany()
  }

  private async findByCollegeMajor(query: string, filters: SearchFilters): Promise<ClubEntity[]> {
    const majorIds = await this.findMatchingCollegeMajorIds(query)
    if (majorIds.length === 0) {
      return []
    }

    const qb = this.buildBaseQuery()
    qb.andWhere('club.college_major_id IN (:...majorIds)', { majorIds })

    applySearchFilters(qb, filters)
    return qb.getMany()
  }

  private async findMatchingCollegeMajorIds(query: string): Promise<number[]> {
    const where: FindOptionsWhere<CollegeMajorEntity>[] = [
      {
        college: ILike(`%${query}%`),
        major: IsNull(),
      },
      { major: ILike(`%${query}%`) },
    ]

    const collegeMajors = await this.collegeMajorRepository.find({ where })
    return collegeMajors.map((it) => it.id)
  }

  private buildBaseQuery(): SelectQueryBuilder<ClubEntity> {
    return this.clubRepository
      .createQueryBuilder('club')
      .where('club.status = :status', { status: PUBLIC_CLUB_STATUS })
      .andWhere('club.deleted_at IS NULL')
  }

  private dedupe(entities: ClubEntity[]): ClubEntity[] {
    return Array.from(new Map(entities.map((it) => [it.uuid, it])).values())
  }
}
