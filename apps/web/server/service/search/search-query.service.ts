import { PUBLIC_CLUB_STATUS } from 'server/domain/constants/club-status'
import type { Prisma, club as PrismaClub } from 'server/infra/database/generated/prisma/client'
import { getPrismaClient } from 'server/infra/database/prisma'
import { Service } from 'server/provider'
import type { SearchFilters } from './search.types'
import { buildSearchFilter } from './search-filter'

@Service
export class SearchQueryService {
  // 검색어가 글에 있는 동아리와, 검색어가 이름에 있는 학과의 동아리를 찾습니다.
  async search(query: string, filters: SearchFilters = {}): Promise<PrismaClub[]> {
    const filter = await buildSearchFilter(filters)
    const baseWhere: Prisma.clubWhereInput = {
      status: PUBLIC_CLUB_STATUS,
      deleted_at: null,
      ...filter,
    }

    // 두 가지를 함께 찾습니다. 서로를 기다리지 않습니다.
    const [textMatches, majorMatches] = await Promise.all([
      this.findByText(query, baseWhere),
      this.findByCollegeMajor(query, baseWhere),
    ])

    return Array.from(
      new Map([...textMatches, ...majorMatches].map((club) => [club.uuid, club])).values(),
    )
  }

  private findByText(query: string, baseWhere: Prisma.clubWhereInput): Promise<PrismaClub[]> {
    return getPrismaClient().club.findMany({
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
    })
  }

  private async findByCollegeMajor(
    query: string,
    baseWhere: Prisma.clubWhereInput,
  ): Promise<PrismaClub[]> {
    const majorIds = await this.findMatchingCollegeMajorIds(query)
    if (majorIds.length === 0) {
      return []
    }

    return getPrismaClient().club.findMany({
      where: { AND: [baseWhere, { college_major_id: { in: majorIds } }] },
    })
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
