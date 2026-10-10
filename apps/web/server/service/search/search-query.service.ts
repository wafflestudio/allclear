import { PUBLIC_CLUB_STATUS } from 'server/domain/constants/club-status'
import type { ClubDomainSource } from 'server/domain/model/Club'
import type { Prisma, club as PrismaClub } from 'server/infra/database/generated/prisma/client'
import { getPrismaClient } from 'server/infra/database/prisma'
import {
  toNullableDateString,
  toNullableTimestampString,
  toStringArray,
} from 'server/infra/database/prisma-mapping'
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
      this.toDomainSource(
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

  private toDomainSource(
    club: PrismaClub,
    collegeMajor: ClubDomainSource['collegeMajor'],
  ): ClubDomainSource {
    return {
      uuid: club.uuid,
      name: club.name,
      description: club.description,
      shortDescription: club.short_description,
      introduction: club.introduction,
      type: club.type,
      category: club.category,
      affiliationType: club.affiliation_type,
      collegeMajorId: club.college_major_id,
      collegeMajor,
      recruitType: club.recruit_type,
      isOfficialVerified: club.is_official_verified,
      verifiedAt: toNullableTimestampString(club.verified_at),
      hasDongbang: club.has_dongbang,
      dongbangLocation: club.dongbang_location,
      minActivityPeriod: club.min_activity_period,
      activeMemberCount: club.active_member_count,
      foundedAt: toNullableDateString(club.founded_at),
      snsUrls: toStringArray(club.sns_urls),
      activityImageUrls: toStringArray(club.activity_image_urls),
      imageUri: club.image_uri,
      article: club.article,
      articleUploadedAt: toNullableTimestampString(club.article_uploaded_at),
      status: PUBLIC_CLUB_STATUS,
      rejectReason: club.reject_reason,
    }
  }
}
