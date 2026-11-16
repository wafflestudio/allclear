import type { ClubDomainSource } from 'server/domain/model/Club'
import type { club as PrismaClub } from 'server/infra/database/generated/prisma/client'
import { getPrismaClient } from 'server/infra/database/prisma'
import { toClubDomainSource } from 'server/infra/database/prisma-club-mapping'

// 찾은 동아리에 단과대·학과를 붙여 도메인 재료로 바꿉니다. 순서는 그대로 둡니다.
export async function toClubDomainSources(clubs: PrismaClub[]): Promise<ClubDomainSource[]> {
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
      club.college_major_id === null ? null : (collegeMajorById.get(club.college_major_id) ?? null),
    ),
  )
}
