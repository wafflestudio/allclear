import { PUBLIC_CLUB_STATUS } from 'server/domain/constants/club-status'
import { ENV } from 'server/ENV'
import { ClubEntity } from 'server/infra/database/entities'
import { CollegeMajorEntity } from 'server/infra/database/entities/college-major.entity'
import { InjectRepository, Service } from 'server/provider'
import {
  type FindOptionsWhere,
  ILike,
  IsNull,
  type Repository,
  type SelectQueryBuilder,
} from 'typeorm'
import { EMBEDDING_VERSION, embedQuery } from './embedding'
import type { SearchFilters } from './search.types'
import { applySearchFilters } from './search-filter'

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

  async searchSemantic(query: string, filters: SearchFilters = {}): Promise<ClubEntity[]> {
    if (!ENV.OPENAI.API_KEY) return []
    try {
      const qb = this.buildBaseQuery()
        .andWhere('club.embedding IS NOT NULL')
        .andWhere('club.embedding_model = :embeddingModel', { embeddingModel: EMBEDDING_VERSION })
      applySearchFilters(qb, filters)
      if (!(await qb.clone().getExists())) return []

      const embedding = JSON.stringify(await embedQuery(query))
      return await qb
        .andWhere('(club.embedding <=> CAST(:embedding AS vector)) <= :maxDistance', {
          embedding,
          maxDistance: 0.75,
        })
        .orderBy('club.embedding <=> CAST(:embedding AS vector)', 'ASC')
        .addOrderBy('club.uuid', 'ASC')
        .limit(20)
        .getMany()
    } catch (error) {
      // SQL 적용 전이나 외부 API 장애 중에도 기존 문자열 검색을 제공합니다.
      console.error(
        'semantic search unavailable:',
        error instanceof Error ? error.message : 'error',
      )
      return []
    }
  }

  private findByText(query: string, filters: SearchFilters): Promise<ClubEntity[]> {
    const qb = this.buildBaseQuery()
    qb.andWhere(
      '(club.name ILIKE :query OR club.short_description ILIKE :query OR club.description ILIKE :query OR club.introduction ILIKE :query)',
      { query: `%${query}%` },
    )

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
      .leftJoinAndSelect('club.collegeMajor', 'collegeMajor')
      .where('club.status = :status', { status: PUBLIC_CLUB_STATUS })
      .andWhere('club.deleted_at IS NULL')
  }

  private dedupe(entities: ClubEntity[]): ClubEntity[] {
    return Array.from(new Map(entities.map((it) => [it.uuid, it])).values())
  }
}
