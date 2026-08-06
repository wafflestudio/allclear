import { SelectQueryBuilder } from 'typeorm'
import { ClubEntity, ClubRecruitmentEntity } from 'server/infra/database/entities'
import { MinActivityPeriodFilter, SearchFilters } from './search.types'

const LATEST_RECRUITMENT_ALIAS = 'latest_recruitment'

export function applySearchFilters(
  qb: SelectQueryBuilder<ClubEntity>,
  filters: SearchFilters,
): SelectQueryBuilder<ClubEntity> {
  if (filters.affiliationType !== undefined) {
    qb.andWhere('club.affiliation_type = :affiliationType', {
      affiliationType: filters.affiliationType,
    })
  }

  if (filters.recruitType !== undefined) {
    qb.andWhere('club.recruit_type = :recruitType', {
      recruitType: filters.recruitType,
    })
  }

  if (filters.hasDongbang !== undefined) {
    qb.andWhere('club.has_dongbang = :hasDongbang', {
      hasDongbang: filters.hasDongbang,
    })
  }

  if (filters.isOfficialVerified !== undefined) {
    qb.andWhere('club.is_official_verified = :isOfficialVerified', {
      isOfficialVerified: filters.isOfficialVerified,
    })
  }

  applyMinActivityPeriodFilter(qb, filters.minActivityPeriods)
  applyRecruitmentFilters(qb, filters)
  return qb
}

function applyMinActivityPeriodFilter(
  qb: SelectQueryBuilder<ClubEntity>,
  minActivityPeriods: MinActivityPeriodFilter[] | undefined,
): void {
  if (minActivityPeriods === undefined || minActivityPeriods.length === 0) {
    return
  }

  const hasThreeOrMore = minActivityPeriods.includes('3_plus')
  const exactValues = minActivityPeriods
    .filter((value): value is '0' | '1' | '2' => value !== '3_plus')
    .map(Number)

  if (hasThreeOrMore && exactValues.length > 0) {
    qb.andWhere(
      '(club.min_activity_period IN (:...minActivityPeriodExactValues) OR club.min_activity_period >= :minActivityPeriodGte)',
      {
        minActivityPeriodExactValues: exactValues,
        minActivityPeriodGte: 3,
      },
    )
    return
  }

  if (hasThreeOrMore) {
    qb.andWhere('club.min_activity_period >= :minActivityPeriodGte', {
      minActivityPeriodGte: 3,
    })
    return
  }

  qb.andWhere('club.min_activity_period IN (:...minActivityPeriodExactValues)', {
    minActivityPeriodExactValues: exactValues,
  })
}

function applyRecruitmentFilters(qb: SelectQueryBuilder<ClubEntity>, filters: SearchFilters): void {
  if (filters.hasMembershipFee === undefined && filters.isRecruiting === undefined) {
    return
  }

  joinLatestRecruitment(qb)

  if (filters.hasMembershipFee !== undefined) {
    qb.andWhere(`${LATEST_RECRUITMENT_ALIAS}.has_membership_fee = :hasMembershipFee`, {
      hasMembershipFee: filters.hasMembershipFee,
    })
  }

  if (filters.isRecruiting === true) {
    qb.andWhere(`${LATEST_RECRUITMENT_ALIAS}.id IS NOT NULL`)
    qb.andWhere(`${LATEST_RECRUITMENT_ALIAS}.deadline > NOW()`)
  }

  if (filters.isRecruiting === false) {
    qb.andWhere(
      `(${LATEST_RECRUITMENT_ALIAS}.id IS NULL OR ${LATEST_RECRUITMENT_ALIAS}.deadline <= NOW())`,
    )
  }
}

function joinLatestRecruitment(qb: SelectQueryBuilder<ClubEntity>): void {
  const alreadyJoined = qb.expressionMap.joinAttributes.some(
    (join) => join.alias.name === LATEST_RECRUITMENT_ALIAS,
  )
  if (alreadyJoined) {
    return
  }

  qb.leftJoin(
    (subQb) =>
      subQb
        .distinctOn(['recruitment.club_id'])
        .select('recruitment.club_id', 'club_id')
        .addSelect('recruitment.id', 'id')
        .addSelect('recruitment.deadline', 'deadline')
        .addSelect('recruitment.has_membership_fee', 'has_membership_fee')
        .from(ClubRecruitmentEntity, 'recruitment')
        .where('recruitment.deleted_at IS NULL')
        .orderBy('recruitment.club_id', 'ASC')
        .addOrderBy('recruitment.year_month', 'DESC')
        .addOrderBy('recruitment.created_at', 'DESC'),
    LATEST_RECRUITMENT_ALIAS,
    `${LATEST_RECRUITMENT_ALIAS}.club_id = club.uuid`,
  )
}
