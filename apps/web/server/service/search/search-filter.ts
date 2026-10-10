import { Prisma } from 'server/infra/database/generated/prisma/client'
import { getPrismaClient } from 'server/infra/database/prisma'
import type { MinActivityPeriodFilter, SearchFilters } from './search.types'

export async function buildSearchFilter(filters: SearchFilters): Promise<Prisma.clubWhereInput> {
  const where: Prisma.clubWhereInput = {
    ...(filters.affiliationType !== undefined && { affiliation_type: filters.affiliationType }),
    ...(filters.recruitType !== undefined && { recruit_type: filters.recruitType }),
    ...(filters.hasDongbang !== undefined && { has_dongbang: filters.hasDongbang }),
    ...(filters.isOfficialVerified !== undefined && {
      is_official_verified: filters.isOfficialVerified,
    }),
  }

  Object.assign(where, buildMinActivityPeriodFilter(filters.minActivityPeriods))

  if (filters.hasMembershipFee !== undefined || filters.isRecruiting !== undefined) {
    where.uuid = await buildRecruitmentFilter(filters)
  }

  return where
}

function buildMinActivityPeriodFilter(
  values: MinActivityPeriodFilter[] | undefined,
): Prisma.clubWhereInput {
  if (!values?.length) {
    return {}
  }

  const exactValues = values.filter((value) => value !== '3_plus').map(Number)
  if (values.includes('3_plus') && exactValues.length > 0) {
    return {
      OR: [{ min_activity_period: { in: exactValues } }, { min_activity_period: { gte: 3 } }],
    }
  }
  if (values.includes('3_plus')) {
    return { min_activity_period: { gte: 3 } }
  }
  return { min_activity_period: { in: exactValues } }
}

async function buildRecruitmentFilter(filters: SearchFilters): Promise<Prisma.StringFilter> {
  // Without a fee filter, false also includes clubs that have no recruitment at all.
  // Select currently recruiting clubs and exclude them in that case.
  const excludeActive = filters.hasMembershipFee === undefined && filters.isRecruiting === false
  const feeCondition =
    filters.hasMembershipFee === undefined
      ? Prisma.empty
      : Prisma.sql`AND latest.has_membership_fee = ${filters.hasMembershipFee}`
  const deadlineCondition =
    filters.isRecruiting === undefined
      ? Prisma.empty
      : excludeActive || filters.isRecruiting
        ? Prisma.sql`AND latest.deadline > NOW()`
        : Prisma.sql`AND latest.deadline <= NOW()`

  const rows = await getPrismaClient().$queryRaw<Array<{ club_id: string }>>`
    SELECT latest.club_id FROM (
      SELECT DISTINCT ON (recruitment.club_id)
        recruitment.club_id, recruitment.deadline, recruitment.has_membership_fee
      FROM club_recruitment AS recruitment
      WHERE recruitment.deleted_at IS NULL
      ORDER BY recruitment.club_id ASC, recruitment.year_month DESC, recruitment.created_at DESC
    ) AS latest
    WHERE TRUE ${feeCondition} ${deadlineCondition}
  `
  const clubIds = rows.map((row) => row.club_id)
  return excludeActive ? { notIn: clubIds } : { in: clubIds }
}
