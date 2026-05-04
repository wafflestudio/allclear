import { IsNull, QueryFailedError, Repository } from 'typeorm'
import { Inject, InjectRepository, Service } from '../provider'
import { ClubRecruitmentEntity } from '../infra/database/entities/club-recruitment.entity'
import { RegularMeetingEntity } from '../infra/database/entities/regular-meeting.entity'
import { ConflictError, NotFoundError } from '../domain/error'
import { ClubRecruitment, toClubRecruitmentDomain } from '../domain/model/ClubRecruitment'
import { CreateClubRecruitment, UpdateClubRecruitment } from 'src/lib/schemas/club-recruitments'
import { formatYearMonth } from 'src/common/utils/formatYearMonth'
import { ClubAccessService } from './club-access.service'

@Service
export class ClubRecruitmentService {
  @InjectRepository(ClubRecruitmentEntity)
  private readonly clubRecruitmentRepository: Repository<ClubRecruitmentEntity>
  @Inject(ClubAccessService)
  private readonly clubAccessService: ClubAccessService

  async findPublicRecruitmentsByClub(
    clubUuid: string,
  ): Promise<{ clubName: string; recruitments: ClubRecruitment[] }> {
    const club = await this.clubAccessService.getPublicClub(clubUuid)
    const recruitments = await this.clubRecruitmentRepository.find({
      where: { clubId: clubUuid, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    })
    return {
      clubName: club.name,
      recruitments: recruitments.map((it) => toClubRecruitmentDomain(it)),
    }
  }

  async findPublicRepresentativeRecruitmentByClub(
    clubUuid: string,
  ): Promise<ClubRecruitment | null> {
    await this.clubAccessService.getPublicClub(clubUuid)
    const recruitment = await this.clubRecruitmentRepository.findOne({
      where: { clubId: clubUuid, deletedAt: IsNull() },
      order: { yearMonth: 'DESC', createdAt: 'DESC' },
    })
    return recruitment ? toClubRecruitmentDomain(recruitment) : null
  }

  async findPublicRecruitmentById(
    recruitmentId: string,
  ): Promise<ClubRecruitment> {
    const recruitment = await this.clubRecruitmentRepository.findOne({
      where: { id: recruitmentId, deletedAt: IsNull() },
    })
    if (!recruitment) {
      throw new NotFoundError('recruitment not found')
    }
    await this.clubAccessService.getPublicClub(recruitment.clubId)
    return toClubRecruitmentDomain(recruitment)
  }

  async findManagedRecruitmentsByClub(
    clubUuid: string,
    serviceUserId: string,
  ): Promise<ClubRecruitment[]> {
    await this.clubAccessService.assertManagedClub(clubUuid, serviceUserId)
    const recruitments = await this.clubRecruitmentRepository.find({
      where: { clubId: clubUuid, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    })
    return recruitments.map((it) => toClubRecruitmentDomain(it))
  }

  async findManagedRecruitmentById(
    clubUuid: string,
    recruitmentId: string,
    serviceUserId: string,
  ): Promise<ClubRecruitment> {
    const recruitment = await this.getManagedRecruitmentEntity(
      clubUuid,
      recruitmentId,
      serviceUserId,
    )
    return toClubRecruitmentDomain(recruitment)
  }

  async createRecruitment(
    clubUuid: string,
    serviceUserId: string,
    recruitment: CreateClubRecruitment,
  ): Promise<ClubRecruitment> {
    await this.clubAccessService.assertManagedClub(clubUuid, serviceUserId)

    const now = new Date().toISOString()
    const saved = await this.clubRecruitmentRepository.manager.transaction(async (manager) => {
      const clubRecruitmentRepository = manager.getRepository(ClubRecruitmentEntity)
      const regularMeetingRepository = manager.getRepository(RegularMeetingEntity)
      const entity = clubRecruitmentRepository.create({
        clubId: clubUuid,
        ...this.toPersistencePayload(recruitment),
        createdAt: now,
        updatedAt: now,
        yearMonth: formatYearMonth(now),
      })

      const created = await this.saveOrThrowConflict(entity, clubRecruitmentRepository)
      const regularMeetings = this.toRegularMeetingEntities(recruitment.regular_meetings).map(
        (regularMeeting) => ({ ...regularMeeting, clubRecruitmentId: created.id }),
      )
      if (regularMeetings.length > 0) {
        await regularMeetingRepository.insert(regularMeetings)
      }
      return this.getRecruitmentEntity(clubUuid, created.id, clubRecruitmentRepository)
    })
    return toClubRecruitmentDomain(saved)
  }

  async updateRecruitment(
    recruitmentId: string,
    serviceUserId: string,
    data: UpdateClubRecruitment,
  ): Promise<ClubRecruitment> {
    const entity = await this.clubRecruitmentRepository.findOne({
      where: { id: recruitmentId, deletedAt: IsNull() },
    })
    if (!entity) {
      throw new NotFoundError('recruitment not found')
    }

    await this.clubAccessService.assertManagedClub(entity.clubId, serviceUserId)

    const saved = await this.clubRecruitmentRepository.manager.transaction(async (manager) => {
      const clubRecruitmentRepository = manager.getRepository(ClubRecruitmentEntity)
      const regularMeetingRepository = manager.getRepository(RegularMeetingEntity)

      Object.assign(entity, this.toUpdatePayload(data), { updatedAt: new Date().toISOString() })
      const updated = await this.saveOrThrowConflict(entity, clubRecruitmentRepository)

      if (data.regular_meetings !== undefined) {
        await regularMeetingRepository.delete({ clubRecruitmentId: entity.id })
        const regularMeetings = this.toRegularMeetingEntities(data.regular_meetings).map(
          (regularMeeting) => ({ ...regularMeeting, clubRecruitmentId: updated.id }),
        )
        if (regularMeetings.length > 0) {
          await regularMeetingRepository.insert(regularMeetings)
        }
      }

      return this.getRecruitmentEntity(entity.clubId, recruitmentId, clubRecruitmentRepository)
    })

    return toClubRecruitmentDomain(saved)
  }

  async deleteRecruitment(recruitmentId: string, serviceUserId: string): Promise<void> {
    const recruitment = await this.clubRecruitmentRepository.findOne({
      where: { id: recruitmentId, deletedAt: IsNull() },
    })
    if (!recruitment) {
      throw new NotFoundError('recruitment not found')
    }
    await this.clubAccessService.assertManagedClub(recruitment.clubId, serviceUserId)
    await this.clubRecruitmentRepository.softDelete(recruitment.id)
  }

  private toPersistencePayload(
    recruitment: CreateClubRecruitment,
  ): Omit<
    ClubRecruitmentEntity,
    | 'id'
    | 'clubId'
    | 'regularMeetings'
    | 'yearMonth'
    | 'createdAt'
    | 'updatedAt'
    | 'deletedAt'
    | 'syncYearMonth'
  > {
    return {
      title: recruitment.title,
      deadline: new Date(recruitment.deadline).toISOString(),
      isMandatory: recruitment.is_mandatory,
      hasRegularMeeting: recruitment.has_regular_meeting,
      activityLocationType: recruitment.activity_location_type,
      activityLocationText: recruitment.activity_location_text,
      hasEligibility: recruitment.has_eligibility,
      eligibilityText: recruitment.eligibility_text,
      hasCapacityLimit: recruitment.has_capacity_limit,
      capacityLimitText: recruitment.capacity_limit_text,
      hasMembershipFee: recruitment.has_membership_fee,
      membershipFeeText: recruitment.membership_fee_text,
      applicationUrl: recruitment.application_url,
      applicationProcess: recruitment.application_process,
      fullRecruitmentText: recruitment.full_recruitment_text,
      imageUrls: recruitment.image_urls,
    }
  }

  private toUpdatePayload(data: UpdateClubRecruitment): Partial<ClubRecruitmentEntity> {
    const raw = {
      title: data.title,
      deadline: data.deadline !== undefined ? new Date(data.deadline).toISOString() : undefined,
      isMandatory: data.is_mandatory,
      hasRegularMeeting: data.has_regular_meeting,
      activityLocationType: data.activity_location_type,
      activityLocationText: data.activity_location_text,
      hasEligibility: data.has_eligibility,
      eligibilityText: data.eligibility_text,
      hasCapacityLimit: data.has_capacity_limit,
      capacityLimitText: data.capacity_limit_text,
      hasMembershipFee: data.has_membership_fee,
      membershipFeeText: data.membership_fee_text,
      applicationUrl: data.application_url,
      applicationProcess: data.application_process,
      fullRecruitmentText: data.full_recruitment_text,
      imageUrls: data.image_urls,
    }
    return Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== undefined))
  }

  private toRegularMeetingEntities(
    regularMeetings: CreateClubRecruitment['regular_meetings'],
  ): Partial<RegularMeetingEntity>[] {
    return regularMeetings.map((regularMeeting) => ({
      dayOfWeek: regularMeeting.day_of_week,
      startTime: regularMeeting.start_time,
      endTime: regularMeeting.end_time,
    }))
  }

  private async getManagedRecruitmentEntity(
    clubUuid: string,
    recruitmentId: string,
    serviceUserId: string,
  ): Promise<ClubRecruitmentEntity> {
    await this.clubAccessService.assertManagedClub(clubUuid, serviceUserId)
    return this.getRecruitmentEntity(clubUuid, recruitmentId)
  }

  private async getRecruitmentEntity(
    clubUuid: string,
    recruitmentId: string,
    repository: Repository<ClubRecruitmentEntity> = this.clubRecruitmentRepository,
  ): Promise<ClubRecruitmentEntity> {
    const recruitment = await repository.findOne({
      where: { id: recruitmentId, clubId: clubUuid, deletedAt: IsNull() },
    })
    if (!recruitment) {
      throw new NotFoundError('recruitment not found')
    }
    return recruitment
  }

  private async saveOrThrowConflict(
    entity: ClubRecruitmentEntity,
    repository: Repository<ClubRecruitmentEntity> = this.clubRecruitmentRepository,
  ): Promise<ClubRecruitmentEntity> {
    try {
      return await repository.save(entity)
    } catch (error) {
      if (this.isMonthlyRecruitmentConflict(error)) {
        throw new ConflictError('recruitment already exists for this month')
      }
      throw error
    }
  }

  private isMonthlyRecruitmentConflict(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false
    }
    const driverError = (
      error as QueryFailedError & { driverError?: { code?: string; constraint?: string } }
    ).driverError
    return (
      driverError?.code === '23505' && driverError?.constraint === 'idx_unique_club_month_active'
    )
  }
}
