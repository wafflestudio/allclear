import { PUBLIC_CLUB_STATUS } from 'server/domain/constants/club-status'
import type { ClubDomainSource } from 'server/domain/model/Club'
import { ENV } from 'server/ENV'
import { Prisma, type club as PrismaClub } from 'server/infra/database/generated/prisma/client'
import { getPrismaClient } from 'server/infra/database/prisma'
import { toClubDomainSource } from 'server/infra/database/prisma-club-mapping'
import { Service } from 'server/provider'
import { EMBEDDING_VERSION, embedQuery } from './embedding'
import type { SearchFilters } from './search.types'
import { buildSearchFilter } from './search-filter'

@Service
export class SearchQueryService {
  async search(query: string, filters: SearchFilters = {}): Promise<ClubDomainSource[]> {
    const prisma = getPrismaClient()
    const filter = await buildSearchFilter(filters)
    const baseWhere: Prisma.clubWhereInput = {
      status: PUBLIC_CLUB_STATUS,
      deleted_at: null,
      ...filter,
    }

    const majorIds = await this.findMatchingCollegeMajorIds(query)
    const [textMatches, majorMatches] = await Promise.all([
      prisma.club.findMany({
        where: {
          AND: [
            baseWhere,
            {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { short_description: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                { introduction: { contains: query, mode: 'insensitive' } },
              ],
            },
          ],
        },
      }),
      majorIds.length
        ? prisma.club.findMany({
            where: { AND: [baseWhere, { college_major_id: { in: majorIds } }] },
          })
        : Promise.resolve([]),
    ])

    const uniqueClubs = Array.from(
      new Map([...textMatches, ...majorMatches].map((club) => [club.uuid, club])).values(),
    )
    return this.toDomainSources(uniqueClubs)
  }

  async searchSemantic(query: string, filters: SearchFilters = {}): Promise<ClubDomainSource[]> {
    if (!ENV.OPENAI.API_KEY) return []
    try {
      const prisma = getPrismaClient()
      const where: Prisma.clubWhereInput = {
        status: PUBLIC_CLUB_STATUS,
        deleted_at: null,
        embedding_model: EMBEDDING_VERSION,
        ...(await buildSearchFilter(filters)),
      }
      // 기존 Prisma 필터를 먼저 적용하고, 벡터 연산만 raw SQL로 처리합니다.
      const candidates = await prisma.club.findMany({ where, select: { uuid: true } })
      if (candidates.length === 0) return []

      const vector = JSON.stringify(await embedQuery(query))
      const ranked = await prisma.$queryRaw<Array<{ uuid: string }>>`
        SELECT uuid FROM public.club
        WHERE uuid IN (${Prisma.join(candidates.map((club) => Prisma.sql`${club.uuid}::uuid`))})
          AND status = ${PUBLIC_CLUB_STATUS} AND deleted_at IS NULL
          AND embedding_model = ${EMBEDDING_VERSION} AND embedding IS NOT NULL
          AND (embedding <=> ${vector}::vector) <= 0.76
        ORDER BY embedding <=> ${vector}::vector ASC, uuid ASC
        LIMIT 20
      `
      if (ranked.length === 0) return []

      const clubs = await prisma.club.findMany({
        where: { AND: [where, { uuid: { in: ranked.map((club) => club.uuid) } }] },
      })
      const byId = new Map(clubs.map((club) => [club.uuid, club]))
      return this.toDomainSources(ranked.flatMap(({ uuid }) => byId.get(uuid) ?? []))
    } catch (error) {
      // 의미 검색 장애가 문자열 검색까지 중단시키지 않도록 합니다.
      console.error(
        'semantic search unavailable:',
        error instanceof Error ? error.message : 'error',
      )
      return []
    }
  }

  private async toDomainSources(clubs: PrismaClub[]): Promise<ClubDomainSource[]> {
    if (clubs.length === 0) return []
    const prisma = getPrismaClient()

    // Prisma has no relation for college_major in the existing schema.
    const collegeMajorIds = Array.from(
      new Set(clubs.map((club) => club.college_major_id).filter((id): id is number => id !== null)),
    )
    const collegeMajors = collegeMajorIds.length
      ? await prisma.college_major.findMany({
          where: { id: { in: collegeMajorIds }, deleted_at: null },
          select: { id: true, college: true, major: true },
        })
      : []
    const collegeMajorById = new Map(collegeMajors.map((major) => [major.id, major]))
    return clubs.map((club) =>
      toClubDomainSource(
        club,
        club.college_major_id === null
          ? null
          : (collegeMajorById.get(club.college_major_id) ?? null),
      ),
    )
  }

  private async findMatchingCollegeMajorIds(query: string): Promise<number[]> {
    const collegeMajors = await getPrismaClient().college_major.findMany({
      where: {
        deleted_at: null,
        OR: [
          { college: { contains: query, mode: 'insensitive' }, major: null },
          { major: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: { id: true },
    })
    return collegeMajors.map((major) => major.id)
  }
}
