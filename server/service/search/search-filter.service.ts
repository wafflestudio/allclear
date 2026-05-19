import { SelectQueryBuilder } from 'typeorm'
import { Service } from 'server/provider'
import { ClubEntity } from 'server/infra/database/entities'
import { MinActivityPeriodFilter, SearchFilters } from './search.types'

const LATEST_RECRUITMENT_ALIAS = 'latest_recruitment'
const LATEST_RECRUITMENT_JOIN = `
  LATERAL (
    SELECT recruitment.*
    FROM club_recruitment recruitment
    WHERE recruitment.club_id = club.uuid
      AND recruitment.deleted_at IS NULL
    ORDER BY recruitment.year_month DESC, recruitment.created_at DESC
    LIMIT 1
  )
`

@Service
export class SearchFilterService {
  apply(
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

    this.applyMinActivityPeriodFilter(qb, filters.minActivityPeriods)
    this.applyRecruitmentFilters(qb, filters)
    return qb
  }

  private applyMinActivityPeriodFilter(
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

  private applyRecruitmentFilters(
    qb: SelectQueryBuilder<ClubEntity>,
    filters: SearchFilters,
  ): void {
    if (filters.hasMembershipFee === undefined && filters.isRecruiting === undefined) {
      return
    }

    this.joinLatestRecruitment(qb)

    if (filters.hasMembershipFee !== undefined) {
      qb.andWhere('latest_recruitment.has_membership_fee = :hasMembershipFee', {
        hasMembershipFee: filters.hasMembershipFee,
      })
    }

    if (filters.isRecruiting === true) {
      qb.andWhere('latest_recruitment.id IS NOT NULL')
      qb.andWhere('latest_recruitment.deadline > NOW()')
    }

    if (filters.isRecruiting === false) {
      qb.andWhere(
        '(latest_recruitment.id IS NULL OR latest_recruitment.deadline <= NOW())',
      )
    }
  }

  private joinLatestRecruitment(qb: SelectQueryBuilder<ClubEntity>): void {
    const alreadyJoined = qb.expressionMap.joinAttributes.some(
      (join) => join.alias.name === LATEST_RECRUITMENT_ALIAS,
    )
    if (alreadyJoined) {
      return
    }
    qb.leftJoin(LATEST_RECRUITMENT_JOIN, LATEST_RECRUITMENT_ALIAS, 'TRUE')
  }
}
