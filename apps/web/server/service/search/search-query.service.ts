import { PUBLIC_CLUB_STATUS } from 'server/domain/constants/club-status'
import type { ClubDomainSource } from 'server/domain/model/Club'
import type { Prisma } from 'server/infra/database/generated/prisma/client'
import { getPrismaClient } from 'server/infra/database/prisma'
import { Service } from 'server/provider'
import type { SearchFilters } from './search.types'
import { toClubDomainSources } from './search-club-source'
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
    return toClubDomainSources(uniqueClubs)
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
