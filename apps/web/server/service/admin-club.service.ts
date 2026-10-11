import {
  type ClubStatus,
  PENDING_CLUB_STATUS,
  PUBLIC_CLUB_STATUS,
  REJECTED_CLUB_STATUS,
} from 'server/domain/constants/club-status'
import { ConflictError, NotFoundError } from 'server/domain/error'
import type {
  AdminClubHistoriesQuery,
  AdminClubManagerRequestStatusUpdate,
  AdminClubManagerRequestsQuery,
  AdminClubStatusUpdate,
  AdminClubsQuery,
  AdminClubVerificationRequestStatusUpdate,
  AdminClubVerificationRequestsQuery,
} from 'server/http/schemas/admin'
import type { Repository } from 'typeorm'
import {
  ClubEntity,
  ClubHistoryEntity,
  ServiceUserEntity,
  UserEntity,
} from '../infra/database/entities'
import { ClubManagerEntity } from '../infra/database/entities/club-manager.entity'
import { ClubManagerRequestEntity } from '../infra/database/entities/club-manager-request.entity'
import { ClubVerificationRequestEntity } from '../infra/database/entities/club-verification-request.entity'
import type {
  UserNotificationMetadata,
  UserNotificationType,
} from '../infra/database/entities/user-notification.entity'
import type { Prisma } from '../infra/database/generated/prisma/client'
import { getPrismaClient } from '../infra/database/prisma'
import { toStringArray, toTimestampString } from '../infra/database/prisma-mapping'
import { InjectRepository, Service } from '../provider'

export type AdminClubItem = {
  uuid: string
  name: string
  status: ClubStatus
  category: string
  affiliation: string
  short_description: string
  created_at: string
  manager: {
    name: string
    phone: string
    student_id: string
  }
}

export type AdminClubDetail = {
  club_data: {
    uuid: string
    status: ClubStatus
    name: string
    type: string
    category: string
    affiliation: string
    college_major_id: number | null
    short_description: string
    image_uri: string
    recruit_type: string | null
    min_activity_period: number
    has_dongbang: boolean
    dongbang_location: string
    sns_urls: string[]
    introduction: string | null
    activity_image_urls: string[]
    created_at: string
    reject_reason: string | null
  }
  manager_data: {
    name: string
    phone: string
    student_id: string
    service_user_id: string
  }
}

export type AdminClubHistoryItem = {
  id: number
  club_uuid: string
  club_name: string
  updated_by: {
    service_user_id: string
    name: string
  }
  changed_fields: string[]
  before_data: Record<string, unknown>
  after_data: Record<string, unknown>
  created_at: string
}

export type AdminClubManagerRequestItem = {
  id: number
  club_uuid: string
  club_name: string
  has_manager: boolean
  applicant: {
    service_user_id: string
    name: string
    phone: string
    student_id: string
  }
  status: ClubStatus
  reject_reason: string | null
  created_at: string
}

export type AdminClubVerificationRequestItem = {
  id: number
  club_uuid: string
  club_name: string
  category: string
  status: ClubStatus
  reject_reason: string | null
  created_at: string
}

type AdminPaginatedList<TItemsKey extends string, TItem> = {
  total_count: number
} & Record<TItemsKey, TItem[]>

const getClubAffiliation = (
  affiliationType: string,
  collegeMajor: { college: string | null; major: string | null } | null | undefined,
): string =>
  affiliationType === '소속동아리'
    ? (collegeMajor?.major ?? collegeMajor?.college ?? '')
    : affiliationType

@Service
export class AdminClubService {
  @InjectRepository(ClubHistoryEntity)
  private readonly clubHistoryRepository: Repository<ClubHistoryEntity>

  @InjectRepository(ClubManagerRequestEntity)
  private readonly clubManagerRequestRepository: Repository<ClubManagerRequestEntity>

  @InjectRepository(ClubVerificationRequestEntity)
  private readonly clubVerificationRequestRepository: Repository<ClubVerificationRequestEntity>

  async getAdminClubs({
    status,
    affiliation_type: affiliationType,
    exclude_affiliation_type: excludeAffiliationType,
    offset,
    limit,
  }: AdminClubsQuery): Promise<AdminPaginatedList<'clubs', AdminClubItem>> {
    const where: Prisma.clubWhereInput = { deleted_at: null }
    if (status) {
      where.status = status
    }
    if (affiliationType) {
      where.affiliation_type = affiliationType
    }
    if (excludeAffiliationType) {
      where.affiliation_type = { not: excludeAffiliationType }
    }

    const prisma = getPrismaClient()
    const [clubs, totalCount] = await Promise.all([
      prisma.club.findMany({
        where,
        orderBy: [{ created_at: 'desc' }, { uuid: 'asc' }],
        skip: offset,
        take: limit,
      }),
      prisma.club.count({ where }),
    ])

    if (clubs.length === 0) {
      return {
        total_count: totalCount,
        clubs: [],
      }
    }

    const majorIds = Array.from(
      new Set(clubs.map((club) => club.college_major_id).filter((id): id is number => id !== null)),
    )
    const [managers, majors] = await Promise.all([
      prisma.club_manager.findMany({
        where: { club_id: { in: clubs.map((club) => club.uuid) }, deleted_at: null },
        select: { club_id: true, name: true, phone: true, student_id: true },
      }),
      majorIds.length
        ? prisma.college_major.findMany({
            where: { id: { in: majorIds }, deleted_at: null },
            select: { id: true, college: true, major: true },
          })
        : Promise.resolve([]),
    ])
    const managerMap = new Map(managers.map((manager) => [manager.club_id, manager]))
    const majorMap = new Map(majors.map((major) => [major.id, major] as const))

    return {
      total_count: totalCount,
      clubs: clubs.map((club) => {
        const manager = managerMap.get(club.uuid)
        return {
          uuid: club.uuid,
          name: club.name,
          status: club.status as ClubStatus,
          category: club.category,
          affiliation: getClubAffiliation(
            club.affiliation_type,
            club.college_major_id === null ? null : majorMap.get(club.college_major_id),
          ),
          short_description: club.short_description,
          created_at: toTimestampString(club.created_at),
          manager: {
            name: manager?.name ?? '',
            phone: manager?.phone ?? '',
            student_id: manager?.student_id ?? '',
          },
        }
      }),
    }
  }

  async getAdminClubDetail(clubUuid: string): Promise<AdminClubDetail> {
    const prisma = getPrismaClient()
    const club = await prisma.club.findFirst({
      where: { uuid: clubUuid, deleted_at: null },
    })

    if (!club) {
      throw new NotFoundError('club not found')
    }

    const [manager, collegeMajor] = await Promise.all([
      prisma.club_manager.findFirst({
        where: { club_id: clubUuid, deleted_at: null },
        select: { name: true, phone: true, student_id: true, service_user_id: true },
      }),
      club.college_major_id === null
        ? Promise.resolve(null)
        : prisma.college_major.findFirst({
            where: { id: club.college_major_id, deleted_at: null },
            select: { college: true, major: true },
          }),
    ])

    return {
      club_data: {
        uuid: club.uuid,
        status: club.status as ClubStatus,
        name: club.name,
        type: club.type,
        category: club.category,
        affiliation: getClubAffiliation(club.affiliation_type, collegeMajor),
        college_major_id: club.college_major_id,
        short_description: club.short_description,
        image_uri: club.image_uri,
        recruit_type: club.recruit_type,
        min_activity_period: club.min_activity_period,
        has_dongbang: club.has_dongbang,
        dongbang_location: club.dongbang_location ?? '',
        sns_urls: toStringArray(club.sns_urls),
        introduction: club.introduction,
        activity_image_urls: toStringArray(club.activity_image_urls),
        created_at: toTimestampString(club.created_at),
        reject_reason: club.reject_reason,
      },
      manager_data: {
        name: manager?.name ?? '',
        phone: manager?.phone ?? '',
        student_id: manager?.student_id ?? '',
        service_user_id: manager?.service_user_id ?? '',
      },
    }
  }

  async updateAdminClubStatus(
    clubUuid: string,
    decision: AdminClubStatusUpdate,
  ): Promise<{ club_uuid: string; status: AdminClubStatusUpdate['status']; processed_at: string }> {
    return getPrismaClient().$transaction(async (tx) => {
      const clubs = await tx.$queryRaw<Array<{ status: string }>>`
        SELECT status FROM club
        WHERE uuid = ${clubUuid}::uuid AND deleted_at IS NULL
        FOR UPDATE
      `
      const club = clubs[0]

      if (!club) {
        throw new NotFoundError('club not found')
      }

      const processedAt = new Date()
      const isApproved = decision.status === PUBLIC_CLUB_STATUS
      const isRejected = decision.status === REJECTED_CLUB_STATUS
      const isPending = decision.status === PENDING_CLUB_STATUS
      const notificationType = this.getClubRegistrationNotificationType(decision.status)
      const shouldCreateNotification = club.status !== decision.status && notificationType !== null

      await tx.club.updateMany({
        where: { uuid: clubUuid, deleted_at: null },
        data: {
          status: decision.status,
          approved_at: isApproved ? processedAt : null,
          reject_reason: isRejected ? (decision.reject_reason?.trim() ?? '') : '',
          is_official_verified: isApproved ? decision.is_official_verified : false,
          verified_at: isApproved && decision.is_official_verified ? processedAt : null,
          updated_at: processedAt,
        },
      })

      if (isPending) {
        await tx.user_notification.deleteMany({
          where: {
            source_type: 'CLUB',
            source_id: clubUuid,
            type: { in: this.getClubRegistrationResultNotificationTypes() },
          },
        })
      }

      if (shouldCreateNotification) {
        const clubManagers = await tx.club_manager.findMany({
          where: { club_id: clubUuid, deleted_at: null },
          select: { service_user_id: true },
        })
        const serviceUserIds = Array.from(new Set(clubManagers.map((it) => it.service_user_id)))
        const metadata = this.getNotificationMetadata(notificationType, decision.reject_reason)
        if (serviceUserIds.length > 0) {
          await tx.user_notification.createMany({
            data: serviceUserIds.map((serviceUserId) => ({
              service_user_id: serviceUserId,
              type: notificationType,
              club_id: clubUuid,
              source_type: 'CLUB',
              source_id: clubUuid,
              ...(metadata && { metadata }),
            })),
          })
        }
      }

      return {
        club_uuid: clubUuid,
        status: decision.status,
        processed_at: processedAt.toISOString(),
      }
    })
  }

  async getAdminClubHistories({
    club_uuid: clubUuid,
    query,
    affiliation_type: affiliationType,
    exclude_affiliation_type: excludeAffiliationType,
    offset,
    limit,
  }: AdminClubHistoriesQuery): Promise<{ total_count: number; histories: AdminClubHistoryItem[] }> {
    const trimmedQuery = query?.trim()
    const baseQuery = this.clubHistoryRepository
      .createQueryBuilder('history')
      .leftJoin(ClubEntity, 'club', 'club.uuid = history.club_id')
      .leftJoin(
        ClubManagerEntity,
        'manager',
        'manager.club_id = history.club_id AND manager.service_user_id = history.service_user_id',
      )
      .leftJoin(ServiceUserEntity, 'service_user', 'service_user.id = history.service_user_id')
      .leftJoin(UserEntity, 'app_user', 'app_user.id = service_user.user_id')

    if (clubUuid) {
      baseQuery.andWhere('history.club_id = :clubUuid', { clubUuid })
    }

    if (affiliationType) {
      baseQuery.andWhere('club.affiliation_type = :affiliationType', { affiliationType })
    }
    if (excludeAffiliationType) {
      baseQuery.andWhere('club.affiliation_type != :excludeAffiliationType', {
        excludeAffiliationType,
      })
    }

    if (trimmedQuery) {
      baseQuery.andWhere(
        '(club.name ILIKE :query OR manager.name ILIKE :query OR app_user.name ILIKE :query)',
        {
          query: `%${trimmedQuery}%`,
        },
      )
    }

    const totalCount = await baseQuery.getCount()
    const histories = await baseQuery
      .clone()
      .select([
        'history.id AS id',
        'history.club_id AS club_uuid',
        "COALESCE(club.name, '') AS club_name",
        'history.service_user_id AS service_user_id',
        "COALESCE(NULLIF(manager.name, ''), NULLIF(app_user.name, ''), '') AS updated_by_name",
        'history.changed_fields AS changed_fields',
        'history.before_data AS before_data',
        'history.after_data AS after_data',
        'history.created_at AS created_at',
      ])
      .orderBy('history.created_at', 'DESC')
      .addOrderBy('history.id', 'DESC')
      .offset(offset)
      .limit(limit)
      .getRawMany<{
        id: string
        club_uuid: string
        club_name: string
        service_user_id: string
        updated_by_name: string
        changed_fields: string[]
        before_data: Record<string, unknown>
        after_data: Record<string, unknown>
        created_at: string
      }>()

    return {
      total_count: totalCount,
      histories: histories.map((history) => ({
        id: Number(history.id),
        club_uuid: history.club_uuid,
        club_name: history.club_name,
        updated_by: {
          service_user_id: history.service_user_id,
          name: history.updated_by_name,
        },
        changed_fields: history.changed_fields,
        before_data: history.before_data,
        after_data: history.after_data,
        created_at: history.created_at,
      })),
    }
  }

  async getAdminClubManagerRequests({
    status,
    affiliation_type: affiliationType,
    exclude_affiliation_type: excludeAffiliationType,
    offset,
    limit,
  }: AdminClubManagerRequestsQuery): Promise<
    AdminPaginatedList<'requests', AdminClubManagerRequestItem>
  > {
    const baseQuery = this.clubManagerRequestRepository
      .createQueryBuilder('manager_request')
      .leftJoin(ClubEntity, 'club', 'club.uuid = manager_request.club_id')

    if (status) {
      baseQuery.andWhere('manager_request.status = :status', { status })
    }
    if (affiliationType) {
      baseQuery.andWhere('club.affiliation_type = :affiliationType', { affiliationType })
    }
    if (excludeAffiliationType) {
      baseQuery.andWhere('club.affiliation_type != :excludeAffiliationType', {
        excludeAffiliationType,
      })
    }

    const totalCount = await baseQuery.getCount()
    const requests = await baseQuery
      .clone()
      .select([
        'manager_request.id AS id',
        'manager_request.club_id AS club_uuid',
        "COALESCE(club.name, '') AS club_name",
        'EXISTS (SELECT 1 FROM club_manager WHERE club_manager.club_id = manager_request.club_id) AS has_manager',
        'manager_request.service_user_id AS service_user_id',
        'manager_request.name AS applicant_name',
        'manager_request.phone AS applicant_phone',
        'manager_request.student_id AS applicant_student_id',
        'manager_request.status AS status',
        'manager_request.reject_reason AS reject_reason',
        'manager_request.created_at AS created_at',
      ])
      .orderBy('manager_request.created_at', 'DESC')
      .addOrderBy('manager_request.id', 'DESC')
      .offset(offset)
      .limit(limit)
      .getRawMany<{
        id: string
        club_uuid: string
        club_name: string
        has_manager: boolean
        service_user_id: string
        applicant_name: string
        applicant_phone: string
        applicant_student_id: string
        status: ClubStatus
        reject_reason: string | null
        created_at: string
      }>()

    return {
      total_count: totalCount,
      requests: requests.map((request) => ({
        id: Number(request.id),
        club_uuid: request.club_uuid,
        club_name: request.club_name,
        has_manager: request.has_manager,
        applicant: {
          service_user_id: request.service_user_id,
          name: request.applicant_name,
          phone: request.applicant_phone,
          student_id: request.applicant_student_id,
        },
        status: request.status,
        reject_reason: request.reject_reason,
        created_at: request.created_at,
      })),
    }
  }

  async getAdminClubVerificationRequests({
    status,
    affiliation_type: affiliationType,
    exclude_affiliation_type: excludeAffiliationType,
    offset,
    limit,
  }: AdminClubVerificationRequestsQuery): Promise<
    AdminPaginatedList<'requests', AdminClubVerificationRequestItem>
  > {
    const baseQuery = this.clubVerificationRequestRepository
      .createQueryBuilder('verification_request')
      .leftJoin(ClubEntity, 'club', 'club.uuid = verification_request.club_id')

    if (status) {
      baseQuery.andWhere('verification_request.status = :status', { status })
    }
    if (affiliationType) {
      baseQuery.andWhere('club.affiliation_type = :affiliationType', { affiliationType })
    }
    if (excludeAffiliationType) {
      baseQuery.andWhere('club.affiliation_type != :excludeAffiliationType', {
        excludeAffiliationType,
      })
    }

    const totalCount = await baseQuery.getCount()
    const requests = await baseQuery
      .clone()
      .select([
        'verification_request.id AS id',
        'verification_request.club_id AS club_uuid',
        "COALESCE(club.name, '') AS club_name",
        "COALESCE(club.category, '') AS category",
        'verification_request.status AS status',
        'verification_request.reject_reason AS reject_reason',
        'verification_request.created_at AS created_at',
      ])
      .orderBy('verification_request.created_at', 'DESC')
      .addOrderBy('verification_request.id', 'DESC')
      .offset(offset)
      .limit(limit)
      .getRawMany<{
        id: string
        club_uuid: string
        club_name: string
        category: string
        status: ClubStatus
        reject_reason: string | null
        created_at: string
      }>()

    return {
      total_count: totalCount,
      requests: requests.map((request) => ({
        id: Number(request.id),
        club_uuid: request.club_uuid,
        club_name: request.club_name,
        category: request.category,
        status: request.status,
        reject_reason: request.reject_reason,
        created_at: request.created_at,
      })),
    }
  }

  async updateAdminClubManagerRequestStatus(
    requestId: number,
    decision: AdminClubManagerRequestStatusUpdate,
  ): Promise<{
    request_id: number
    club_uuid: string
    status: AdminClubManagerRequestStatusUpdate['status']
    processed_at: string
  }> {
    return getPrismaClient().$transaction(async (tx) => {
      const requests = await tx.$queryRaw<
        Array<{
          id: bigint
          club_id: string
          service_user_id: string
          name: string
          phone: string
          student_id: string
          status: string
        }>
      >`
        SELECT id, club_id, service_user_id, name, phone, student_id, status
        FROM club_manager_request
        WHERE id = ${BigInt(requestId)}::bigint
        FOR UPDATE
      `
      const request = requests[0]
      if (!request) {
        throw new NotFoundError('manager request not found')
      }

      const processedAt = new Date().toISOString()
      const isApproved = decision.status === PUBLIC_CLUB_STATUS
      const isRejected = decision.status === REJECTED_CLUB_STATUS
      const isPending = decision.status === PENDING_CLUB_STATUS
      const notificationType = this.getManagerRequestNotificationType(decision.status)
      const shouldCreateNotification =
        request.status !== decision.status && notificationType !== null

      if (isApproved) {
        if (request.status !== PENDING_CLUB_STATUS) {
          throw new ConflictError('can only approve from PENDING status')
        }
        const existingManager = await tx.club_manager.findFirst({
          where: { club_id: request.club_id, deleted_at: null },
          select: { id: true },
        })
        if (existingManager) {
          throw new ConflictError('club already has a manager')
        }

        await tx.club_manager.create({
          data: {
            club_id: request.club_id,
            service_user_id: request.service_user_id,
            name: request.name,
            phone: request.phone,
            student_id: request.student_id,
          },
        })
      }

      if (isPending && request.status === PUBLIC_CLUB_STATUS) {
        await tx.club_manager.deleteMany({
          where: {
            club_id: request.club_id,
            service_user_id: request.service_user_id,
          },
        })
      }

      await tx.club_manager_request.update({
        where: { id: request.id },
        data: {
          status: decision.status,
          reject_reason: isRejected ? (decision.reject_reason?.trim() ?? '') : '',
        },
      })

      if (isPending) {
        await tx.user_notification.deleteMany({
          where: {
            source_type: 'CLUB_MANAGER_REQUEST',
            source_id: request.id.toString(),
            type: { in: this.getManagerRequestResultNotificationTypes() },
          },
        })
      }

      if (shouldCreateNotification) {
        const metadata = this.getNotificationMetadata(notificationType, decision.reject_reason)
        await tx.user_notification.create({
          data: {
            service_user_id: request.service_user_id,
            type: notificationType,
            club_id: request.club_id,
            source_type: 'CLUB_MANAGER_REQUEST',
            source_id: request.id.toString(),
            ...(metadata && { metadata }),
          },
        })
      }

      return {
        request_id: requestId,
        club_uuid: request.club_id,
        status: decision.status,
        processed_at: processedAt,
      }
    })
  }

  private getClubRegistrationNotificationType(status: ClubStatus): UserNotificationType | null {
    if (status === PUBLIC_CLUB_STATUS) {
      return 'CLUB_REGISTRATION_APPROVED'
    }
    if (status === REJECTED_CLUB_STATUS) {
      return 'CLUB_REGISTRATION_REJECTED'
    }
    return null
  }

  private getClubRegistrationResultNotificationTypes(): UserNotificationType[] {
    return ['CLUB_REGISTRATION_APPROVED', 'CLUB_REGISTRATION_REJECTED']
  }

  private getManagerRequestNotificationType(status: ClubStatus): UserNotificationType | null {
    if (status === PUBLIC_CLUB_STATUS) {
      return 'MANAGER_REQUEST_APPROVED'
    }
    if (status === REJECTED_CLUB_STATUS) {
      return 'MANAGER_REQUEST_REJECTED'
    }
    return null
  }

  private getManagerRequestResultNotificationTypes(): UserNotificationType[] {
    return ['MANAGER_REQUEST_APPROVED', 'MANAGER_REQUEST_REJECTED']
  }

  private getNotificationMetadata(
    type: UserNotificationType,
    rejectReason?: string | null,
  ): UserNotificationMetadata | null {
    if (type !== 'CLUB_REGISTRATION_REJECTED' && type !== 'MANAGER_REQUEST_REJECTED') {
      return null
    }

    const trimmedRejectReason = rejectReason?.trim()
    if (!trimmedRejectReason) {
      return null
    }

    return {
      rejectReason: trimmedRejectReason,
    }
  }

  async updateAdminClubVerificationRequestStatus(
    requestId: number,
    decision: AdminClubVerificationRequestStatusUpdate,
  ): Promise<{
    request_id: number
    club_uuid: string
    status: AdminClubVerificationRequestStatusUpdate['status']
    is_official_verified: boolean
    processed_at: string
  }> {
    return getPrismaClient().$transaction(async (tx) => {
      const requests = await tx.$queryRaw<Array<{ id: bigint; club_id: string; status: string }>>`
        SELECT id, club_id, status FROM club_verification_request
        WHERE id = ${BigInt(requestId)}::bigint
        FOR UPDATE
      `
      const request = requests[0]
      if (!request) {
        throw new NotFoundError('verification request not found')
      }

      const processedAt = new Date()
      const isApproved = decision.status === PUBLIC_CLUB_STATUS
      const isRejected = decision.status === REJECTED_CLUB_STATUS
      const isPending = decision.status === PENDING_CLUB_STATUS

      if (isApproved) {
        if (request.status !== PENDING_CLUB_STATUS) {
          throw new ConflictError('can only approve from PENDING status')
        }
        await tx.club.updateMany({
          where: { uuid: request.club_id },
          data: {
            is_official_verified: true,
            verified_at: processedAt,
            updated_at: processedAt,
          },
        })
      }

      if (isPending && request.status === PUBLIC_CLUB_STATUS) {
        await tx.club.updateMany({
          where: { uuid: request.club_id },
          data: {
            is_official_verified: false,
            verified_at: null,
            updated_at: processedAt,
          },
        })
      }

      await tx.club_verification_request.update({
        where: { id: request.id },
        data: {
          status: decision.status,
          reject_reason: isRejected ? (decision.reject_reason?.trim() ?? '') : '',
        },
      })

      return {
        request_id: requestId,
        club_uuid: request.club_id,
        status: decision.status,
        is_official_verified: isApproved,
        processed_at: processedAt.toISOString(),
      }
    })
  }
}
