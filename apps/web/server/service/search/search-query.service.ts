import { PUBLIC_CLUB_STATUS } from 'server/domain/constants/club-status'
import type { ClubDomainSource } from 'server/domain/model/Club'
import type { Prisma } from 'server/infra/database/generated/prisma/client'
import { getPrismaClient } from 'server/infra/database/prisma'
import { toClubDomainSource } from 'server/infra/database/prisma-club-mapping'
import { Service } from 'server/provider'
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
    if (uniqueClubs.length === 0) {
      return []
    }

    // Prisma has no relation for college_major in the existing schema.
    const collegeMajorIds = Array.from(
      new Set(
        uniqueClubs.map((club) => club.college_major_id).filter((id): id is number => id !== null),
      ),
    )
    const collegeMajors = collegeMajorIds.length
      ? await prisma.college_major.findMany({
          where: { id: { in: collegeMajorIds }, deleted_at: null },
          select: { id: true, college: true, major: true },
        })
      : []
    const collegeMajorById = new Map(collegeMajors.map((major) => [major.id, major]))
    return uniqueClubs.map((club) =>
      toClubDomainSource(
        club,
        club.college_major_id === null
          ? null
          : (collegeMajorById.get(club.college_major_id) ?? null),
      ),
    )
  }

  async searchTerms(query: string, filters: SearchFilters = {}): Promise<ClubDomainSource[]> {
    const terms = [...new Set(query.trim().split(/\s+/))].filter(Boolean)
    if (terms.length === 0) return []

    const prisma = getPrismaClient()
    const [filter, collegeMajors] = await Promise.all([
      buildSearchFilter(filters),
      prisma.college_major.findMany({
        where: { deleted_at: null },
        select: { id: true, college: true, major: true },
      }),
    ])
    const majorIdsByTerm = terms.map((term) => {
      const normalized = term.toLowerCase()
      return collegeMajors
        .filter(
          ({ college, major }) =>
            major?.toLowerCase().includes(normalized) ||
            (major === null && college?.toLowerCase().includes(normalized)),
        )
        .map(({ id }) => id)
    })
    const termConditions: Prisma.clubWhereInput[] = terms.map((term, index) => ({
      OR: [
        { name: { contains: term, mode: 'insensitive' } },
        { short_description: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { introduction: { contains: term, mode: 'insensitive' } },
        ...(majorIdsByTerm[index].length
          ? [{ college_major_id: { in: majorIdsByTerm[index] } }]
          : []),
      ],
    }))
    const clubs = await prisma.club.findMany({
      where: {
        AND: [{ status: PUBLIC_CLUB_STATUS, deleted_at: null, ...filter }, ...termConditions],
      },
    })
    if (clubs.length === 0) return []

    const collegeMajorIds = Array.from(
      new Set(clubs.map((club) => club.college_major_id).filter((id): id is number => id !== null)),
    )
    const matchedMajors = collegeMajors.filter(({ id }) => collegeMajorIds.includes(id))
    const collegeMajorById = new Map(matchedMajors.map((major) => [major.id, major]))
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
