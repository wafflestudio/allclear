import { formatYearMonth } from 'server/domain/club/recruitment-year-month'
import type {
  CreateClubRecruitment,
  UpdateClubRecruitment,
} from 'server/http/schemas/club-recruitments'
import { ConflictError, NotFoundError } from '../domain/error'
import type { ClubRecruitment } from '../domain/model/ClubRecruitment'
import { Prisma } from '../infra/database/generated/prisma/client'
import { getPrismaClient } from '../infra/database/prisma'
import {
  type RegularMeetingRow,
  toClubRecruitmentDomain,
} from '../infra/database/prisma-recruitment-mapping'
import { Inject, Service } from '../provider'
import { getSafeDatabaseErrorContext } from '../util/safe-error'
import { ClubAccessService } from './club-access.service'

type RecruitmentClient = Pick<Prisma.TransactionClient, 'club_recruitment' | '$queryRaw'>

@Service
export class ClubRecruitmentService {
  @Inject(ClubAccessService)
  private readonly clubAccessService: ClubAccessService

  async findPublicRecruitmentsByClub(
    clubUuid: string,
  ): Promise<{ clubName: string; recruitments: ClubRecruitment[] }> {
    const club = await this.clubAccessService.getPublicClub(clubUuid)
    return {
      clubName: club.name,
      recruitments: await this.findRecruitmentsByClub(clubUuid),
    }
  }

  async findPublicRepresentativeRecruitmentByClub(
    clubUuid: string,
  ): Promise<ClubRecruitment | null> {
    await this.clubAccessService.getPublicClub(clubUuid)
    const recruitment = await getPrismaClient().club_recruitment.findFirst({
      where: { club_id: clubUuid, deleted_at: null },
      orderBy: [{ year_month: 'desc' }, { created_at: 'desc' }],
    })
    if (!recruitment) {
      return null
    }
    const meetings = await this.loadRegularMeetings([recruitment.id])
    return toClubRecruitmentDomain(recruitment, meetings)
  }

  async findPublicRecruitmentById(recruitmentId: string): Promise<ClubRecruitment> {
    const recruitment = await this.loadRecruitment(BigInt(recruitmentId))
    await this.clubAccessService.getPublicClub(recruitment.clubId)
    return recruitment
  }

  async findManagedRecruitmentsByClub(
    clubUuid: string,
    serviceUserId: string,
  ): Promise<ClubRecruitment[]> {
    await this.clubAccessService.assertManagedClub(clubUuid, serviceUserId)
    return this.findRecruitmentsByClub(clubUuid)
  }

  async findManagedRecruitmentById(
    clubUuid: string,
    recruitmentId: string,
    serviceUserId: string,
  ): Promise<ClubRecruitment> {
    await this.clubAccessService.assertManagedClub(clubUuid, serviceUserId)
    return this.loadRecruitment(BigInt(recruitmentId), clubUuid)
  }

  async createRecruitment(
    clubUuid: string,
    serviceUserId: string,
    recruitment: CreateClubRecruitment,
  ): Promise<ClubRecruitment> {
    await this.clubAccessService.assertManagedClub(clubUuid, serviceUserId)
    const now = new Date()
    return getPrismaClient().$transaction(
      async (tx) => {
        const created = await this.saveOrThrowConflict(
          tx.club_recruitment.create({
            data: {
              club_id: clubUuid,
              ...this.toPersistencePayload(recruitment),
              created_at: now,
              updated_at: now,
              year_month: formatYearMonth(now),
            },
          }),
        )
        await this.insertRegularMeetings(tx, created.id, recruitment.regular_meetings)
        await this.touchClubArticleUploadedAt(clubUuid, now, tx)
        return this.loadRecruitment(created.id, clubUuid, tx)
      },
      { timeout: 30_000 },
    )
  }

  async updateRecruitment(
    recruitmentId: string,
    serviceUserId: string,
    data: UpdateClubRecruitment,
  ): Promise<ClubRecruitment> {
    const id = BigInt(recruitmentId)
    const existing = await getPrismaClient().club_recruitment.findFirst({
      where: { id, deleted_at: null },
      select: { club_id: true },
    })
    if (!existing) {
      throw new NotFoundError('recruitment not found')
    }
    await this.clubAccessService.assertManagedClub(existing.club_id, serviceUserId)

    const now = new Date()
    return getPrismaClient().$transaction(
      async (tx) => {
        const updated = await this.saveOrThrowConflict(
          tx.club_recruitment.updateMany({
            where: { id, deleted_at: null },
            data: { ...this.toUpdatePayload(data), updated_at: now },
          }),
        )
        if (updated.count === 0) {
          throw new NotFoundError('recruitment not found')
        }
        if (data.regular_meetings !== undefined) {
          await tx.regular_meeting.deleteMany({ where: { club_recruitment_id: id } })
          await this.insertRegularMeetings(tx, id, data.regular_meetings)
        }
        await this.touchClubArticleUploadedAt(existing.club_id, now, tx)
        return this.loadRecruitment(id, existing.club_id, tx)
      },
      { timeout: 30_000 },
    )
  }

  async deleteRecruitment(recruitmentId: string, serviceUserId: string): Promise<void> {
    const id = BigInt(recruitmentId)
    const existing = await getPrismaClient().club_recruitment.findFirst({
      where: { id, deleted_at: null },
      select: { club_id: true },
    })
    if (!existing) {
      throw new NotFoundError('recruitment not found')
    }
    await this.clubAccessService.assertManagedClub(existing.club_id, serviceUserId)
    await getPrismaClient().club_recruitment.updateMany({
      where: { id, deleted_at: null },
      data: { deleted_at: new Date() },
    })
  }

  private async findRecruitmentsByClub(clubUuid: string): Promise<ClubRecruitment[]> {
    const prisma = getPrismaClient()
    const recruitments = await prisma.club_recruitment.findMany({
      where: { club_id: clubUuid, deleted_at: null },
      orderBy: { created_at: 'desc' },
    })
    if (recruitments.length === 0) {
      return []
    }
    const meetings = await this.loadRegularMeetings(recruitments.map((item) => item.id))
    const meetingsByRecruitment = new Map<bigint, typeof meetings>()
    for (const meeting of meetings) {
      const group = meetingsByRecruitment.get(meeting.club_recruitment_id) ?? []
      group.push(meeting)
      meetingsByRecruitment.set(meeting.club_recruitment_id, group)
    }
    return recruitments.map((item) =>
      toClubRecruitmentDomain(item, meetingsByRecruitment.get(item.id) ?? []),
    )
  }

  private async loadRecruitment(
    id: bigint,
    clubUuid?: string,
    client: RecruitmentClient = getPrismaClient(),
  ): Promise<ClubRecruitment> {
    const recruitment = await client.club_recruitment.findFirst({
      where: { id, deleted_at: null, ...(clubUuid && { club_id: clubUuid }) },
    })
    if (!recruitment) {
      throw new NotFoundError('recruitment not found')
    }
    const meetings = await this.loadRegularMeetings([id], client)
    return toClubRecruitmentDomain(recruitment, meetings)
  }

  private async loadRegularMeetings(
    recruitmentIds: bigint[],
    client: RecruitmentClient = getPrismaClient(),
  ): Promise<RegularMeetingRow[]> {
    if (recruitmentIds.length === 0) {
      return []
    }
    // Cast TIME(6) to text so fractional seconds survive the JavaScript Date boundary.
    return client.$queryRaw<RegularMeetingRow[]>`
      SELECT id, club_recruitment_id, day_of_week,
             start_time::text AS start_time, end_time::text AS end_time
      FROM regular_meeting
      WHERE club_recruitment_id IN (${Prisma.join(recruitmentIds)})
    `
  }

  private toPersistencePayload(
    data: CreateClubRecruitment,
  ): Omit<Prisma.club_recruitmentUncheckedCreateInput, 'club_id' | 'year_month'> {
    return {
      title: data.title,
      deadline: new Date(data.deadline),
      is_mandatory: data.is_mandatory,
      has_regular_meeting: data.has_regular_meeting,
      activity_location_type: data.activity_location_type,
      activity_location_text: data.activity_location_text,
      has_eligibility: data.has_eligibility,
      eligibility_text: data.eligibility_text,
      has_capacity_limit: data.has_capacity_limit,
      capacity_limit_text: data.capacity_limit_text,
      has_membership_fee: data.has_membership_fee,
      membership_fee_text: data.membership_fee_text,
      application_url: data.application_url,
      application_process: data.application_process,
      full_recruitment_text: data.full_recruitment_text,
      image_urls: data.image_urls,
    }
  }

  private toUpdatePayload(
    data: UpdateClubRecruitment,
  ): Prisma.club_recruitmentUpdateManyMutationInput {
    return {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.deadline !== undefined && { deadline: new Date(data.deadline) }),
      ...(data.is_mandatory !== undefined && { is_mandatory: data.is_mandatory }),
      ...(data.has_regular_meeting !== undefined && {
        has_regular_meeting: data.has_regular_meeting,
      }),
      ...(data.activity_location_type !== undefined && {
        activity_location_type: data.activity_location_type,
      }),
      ...(data.activity_location_text !== undefined && {
        activity_location_text: data.activity_location_text,
      }),
      ...(data.has_eligibility !== undefined && { has_eligibility: data.has_eligibility }),
      ...(data.eligibility_text !== undefined && { eligibility_text: data.eligibility_text }),
      ...(data.has_capacity_limit !== undefined && { has_capacity_limit: data.has_capacity_limit }),
      ...(data.capacity_limit_text !== undefined && {
        capacity_limit_text: data.capacity_limit_text,
      }),
      ...(data.has_membership_fee !== undefined && { has_membership_fee: data.has_membership_fee }),
      ...(data.membership_fee_text !== undefined && {
        membership_fee_text: data.membership_fee_text,
      }),
      ...(data.application_url !== undefined && { application_url: data.application_url }),
      ...(data.application_process !== undefined && {
        application_process: data.application_process,
      }),
      ...(data.full_recruitment_text !== undefined && {
        full_recruitment_text: data.full_recruitment_text,
      }),
      ...(data.image_urls !== undefined && { image_urls: data.image_urls }),
    }
  }

  private async insertRegularMeetings(
    tx: Prisma.TransactionClient,
    recruitmentId: bigint,
    meetings: CreateClubRecruitment['regular_meetings'],
  ): Promise<void> {
    for (const meeting of meetings) {
      await tx.$executeRaw`
        INSERT INTO regular_meeting
          (club_recruitment_id, day_of_week, start_time, end_time)
        VALUES (
          ${recruitmentId}, ${meeting.day_of_week},
          ${meeting.start_time}::time, ${meeting.end_time}::time
        )
      `
    }
  }

  private async touchClubArticleUploadedAt(
    clubUuid: string,
    uploadedAt: Date,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await tx.club.updateMany({
      where: { uuid: clubUuid, deleted_at: null },
      data: { article_uploaded_at: uploadedAt },
    })
  }

  private async saveOrThrowConflict<T>(operation: Promise<T>): Promise<T> {
    try {
      return await operation
    } catch (error) {
      const { databaseCode, prismaCode, constraint } = getSafeDatabaseErrorContext(error)
      const knownConstraint = constraint === 'idx_unique_club_month_active'
      const prismaFields =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002' &&
        Array.isArray(error.meta?.target) &&
        error.meta.target.join(',') === 'club_id,year_month'
      if (
        ((databaseCode === '23505' || prismaCode === 'P2002') && knownConstraint) ||
        prismaFields
      ) {
        throw new ConflictError('recruitment already exists for this month')
      }
      throw error
    }
  }
}
