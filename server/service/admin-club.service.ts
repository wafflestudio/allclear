import { FindOptionsWhere, In, IsNull, Repository } from 'typeorm'
import { InjectRepository, Service } from '../provider'
import {
  ClubEntity,
  ClubHistoryEntity,
  ServiceUserEntity,
  UserEntity,
} from '../infra/database/entities'
import { ClubManagerEntity } from '../infra/database/entities/club-manager.entity'
import { ClubManagerRegisterRequestEntity } from '../infra/database/entities/club-manager-register-request.entity'
import { ClubVerificationRequestEntity } from '../infra/database/entities/club-verification-request.entity'
import {
  UserNotificationEntity,
  type UserNotificationType,
} from '../infra/database/entities/user-notification.entity'
import {
  ClubStatus,
  PENDING_CLUB_STATUS,
  PUBLIC_CLUB_STATUS,
  REJECTED_CLUB_STATUS,
} from 'src/common/constants/club-status'
import { ConflictError, NotFoundError } from 'server/domain/error'
import type {
  AdminClubsQuery,
  AdminClubHistoriesQuery,
  AdminClubManagerRequestStatusUpdate,
  AdminClubManagerRequestsQuery,
  AdminClubStatusUpdate,
  AdminClubVerificationRequestStatusUpdate,
  AdminClubVerificationRequestsQuery,
} from 'src/lib/schemas/admin'

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
    sns: string
    introduction: string | null
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

@Service
export class AdminClubService {
  @InjectRepository(ClubEntity)
  private readonly clubRepository: Repository<ClubEntity>

  @InjectRepository(ClubManagerEntity)
  private readonly clubManagerRepository: Repository<ClubManagerEntity>

  @InjectRepository(ClubHistoryEntity)
  private readonly clubHistoryRepository: Repository<ClubHistoryEntity>

  @InjectRepository(ClubManagerRegisterRequestEntity)
  private readonly clubManagerRegisterRequestRepository: Repository<ClubManagerRegisterRequestEntity>

  @InjectRepository(ClubVerificationRequestEntity)
  private readonly clubVerificationRequestRepository: Repository<ClubVerificationRequestEntity>

  async getAdminClubs({
    status,
    offset,
    limit,
  }: AdminClubsQuery): Promise<AdminPaginatedList<'clubs', AdminClubItem>> {
    const where: FindOptionsWhere<ClubEntity> = {
      deletedAt: IsNull(),
    }
    if (status) {
      where.status = status
    }

    const [clubs, totalCount] = await this.clubRepository.findAndCount({
      where,
      order: { createdAt: 'DESC', uuid: 'ASC' },
      skip: offset,
      take: limit,
    })

    if (clubs.length === 0) {
      return {
        total_count: totalCount,
        clubs: [],
      }
    }

    const managers = await this.clubManagerRepository.findBy({
      clubId: In(clubs.map((c) => c.uuid)),
    })
    const managerMap = new Map(managers.map((m) => [m.clubId, m]))

    return {
      total_count: totalCount,
      clubs: clubs.map((club) => {
        const manager = managerMap.get(club.uuid)
        return {
          uuid: club.uuid,
          name: club.name,
          status: club.status,
          category: club.category,
          affiliation:
            club.affiliationType === '소속동아리'
              ? club.collegeMajor?.major ?? club.collegeMajor?.college ?? ''
              : club.affiliationType,
          short_description: club.shortDescription,
          created_at: club.createdAt,
          manager: {
            name: manager?.name ?? '',
            phone: manager?.phone ?? '',
            student_id: manager?.studentId ?? '',
          },
        }
      }),
    }
  }

  async getAdminClubDetail(clubUuid: string): Promise<AdminClubDetail> {
    const club = await this.clubRepository.findOneBy({
      uuid: clubUuid,
      deletedAt: IsNull(),
    })

    if (!club) {
      throw new NotFoundError('club not found')
    }

    const manager = await this.clubManagerRepository.findOneBy({
      clubId: clubUuid,
    })

    return {
      club_data: {
        uuid: club.uuid,
        status: club.status,
        name: club.name,
        type: club.type,
        category: club.category,
        affiliation:
          club.affiliationType === '소속동아리'
            ? club.collegeMajor?.major ?? club.collegeMajor?.college ?? ''
            : club.affiliationType,
        college_major_id: club.collegeMajorId,
        short_description: club.shortDescription,
        image_uri: club.imageUri,
        recruit_type: club.recruitType,
        min_activity_period: club.minActivityPeriod,
        has_dongbang: club.hasDongbang,
        dongbang_location: club.dongbangLocation,
        sns: club.sns,
        introduction: club.introduction,
        created_at: club.createdAt,
        reject_reason: club.rejectReason,
      },
      manager_data: {
        name: manager?.name ?? '',
        phone: manager?.phone ?? '',
        student_id: manager?.studentId ?? '',
        service_user_id: manager?.serviceUserId ?? '',
      },
    }
  }

  async updateAdminClubStatus(
    clubUuid: string,
    decision: AdminClubStatusUpdate,
  ): Promise<{ club_uuid: string; status: AdminClubStatusUpdate['status']; processed_at: string }> {
    return this.clubRepository.manager.transaction(async (manager) => {
      const clubRepository = manager.getRepository(ClubEntity)
      const clubManagerRepository = manager.getRepository(ClubManagerEntity)
      const userNotificationRepository = manager.getRepository(UserNotificationEntity)

      const club = await clubRepository.findOneBy({
        uuid: clubUuid,
        deletedAt: IsNull(),
      })

      if (!club) {
        throw new NotFoundError('club not found')
      }

      const processedAt = new Date().toISOString()
      const isApproved = decision.status === PUBLIC_CLUB_STATUS
      const isRejected = decision.status === REJECTED_CLUB_STATUS
      const isPending = decision.status === PENDING_CLUB_STATUS
      const notificationType = this.getClubRegistrationNotificationType(decision.status)
      const shouldCreateNotification = club.status !== decision.status && notificationType !== null

      await clubRepository.update(
        {
          uuid: clubUuid,
          deletedAt: IsNull(),
        },
        {
          status: decision.status,
          approvedAt: isApproved ? processedAt : null,
          rejectReason: isRejected ? decision.reject_reason?.trim() ?? '' : '',
          isOfficialVerified: isApproved ? decision.is_official_verified : false,
          verifiedAt: isApproved && decision.is_official_verified ? processedAt : null,
        },
      )

      if (isPending) {
        await userNotificationRepository.delete({
          sourceType: 'CLUB',
          sourceId: clubUuid,
          type: In(this.getClubRegistrationResultNotificationTypes()),
        })
      }

      if (shouldCreateNotification) {
        const clubManagers = await clubManagerRepository.findBy({ clubId: clubUuid })
        const serviceUserIds = Array.from(new Set(clubManagers.map((it) => it.serviceUserId)))
        if (serviceUserIds.length > 0) {
          await userNotificationRepository.insert(
            serviceUserIds.map((serviceUserId) => ({
              serviceUserId,
              type: notificationType,
              clubId: clubUuid,
              sourceType: 'CLUB',
              sourceId: clubUuid,
            })),
          )
        }
      }

      return {
        club_uuid: clubUuid,
        status: decision.status,
        processed_at: processedAt,
      }
    })
  }

  async getAdminClubHistories({
    club_uuid: clubUuid,
    query,
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
    offset,
    limit,
  }: AdminClubManagerRequestsQuery): Promise<
    AdminPaginatedList<'requests', AdminClubManagerRequestItem>
  > {
    const baseQuery = this.clubManagerRegisterRequestRepository
      .createQueryBuilder('manager_request')
      .leftJoin(ClubEntity, 'club', 'club.uuid = manager_request.club_id')

    if (status) {
      baseQuery.andWhere('manager_request.status = :status', { status })
    }

    const totalCount = await baseQuery.getCount()
    const requests = await baseQuery
      .clone()
      .select([
        'manager_request.id AS id',
        'manager_request.club_id AS club_uuid',
        "COALESCE(club.name, '') AS club_name",
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
    return this.clubManagerRegisterRequestRepository.manager.transaction(async (manager) => {
      const managerRequestRepository = manager.getRepository(ClubManagerRegisterRequestEntity)
      const clubManagerRepository = manager.getRepository(ClubManagerEntity)
      const userNotificationRepository = manager.getRepository(UserNotificationEntity)

      const request = await managerRequestRepository.findOneBy({ id: String(requestId) })
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
        const existingManager = await clubManagerRepository.findOneBy({ clubId: request.clubId })
        if (existingManager) {
          throw new ConflictError('club already has a manager')
        }

        await clubManagerRepository.insert({
          clubId: request.clubId,
          serviceUserId: request.serviceUserId,
          name: request.name,
          phone: request.phone,
          studentId: request.studentId,
        })
      }

      if (isPending && request.status === PUBLIC_CLUB_STATUS) {
        await clubManagerRepository.delete({
          clubId: request.clubId,
          serviceUserId: request.serviceUserId,
        })
      }

      await managerRequestRepository.update(
        { id: request.id },
        {
          status: decision.status,
          rejectReason: isRejected ? decision.reject_reason?.trim() ?? '' : '',
        },
      )

      if (isPending) {
        await userNotificationRepository.delete({
          sourceType: 'CLUB_MANAGER_REQUEST',
          sourceId: request.id,
          type: In(this.getManagerRequestResultNotificationTypes()),
        })
      }

      if (shouldCreateNotification) {
        await userNotificationRepository.insert({
          serviceUserId: request.serviceUserId,
          type: notificationType,
          clubId: request.clubId,
          sourceType: 'CLUB_MANAGER_REQUEST',
          sourceId: request.id,
        })
      }

      return {
        request_id: requestId,
        club_uuid: request.clubId,
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
    return this.clubVerificationRequestRepository.manager.transaction(async (manager) => {
      const verificationRequestRepository = manager.getRepository(ClubVerificationRequestEntity)
      const clubRepository = manager.getRepository(ClubEntity)

      const request = await verificationRequestRepository.findOneBy({ id: String(requestId) })
      if (!request) {
        throw new NotFoundError('verification request not found')
      }

      const processedAt = new Date().toISOString()
      const isApproved = decision.status === PUBLIC_CLUB_STATUS
      const isRejected = decision.status === REJECTED_CLUB_STATUS
      const isPending = decision.status === PENDING_CLUB_STATUS

      if (isApproved) {
        if (request.status !== PENDING_CLUB_STATUS) {
          throw new ConflictError('can only approve from PENDING status')
        }
        await clubRepository.update(
          { uuid: request.clubId },
          {
            isOfficialVerified: true,
            verifiedAt: processedAt,
          },
        )
      }

      if (isPending && request.status === PUBLIC_CLUB_STATUS) {
        await clubRepository.update(
          { uuid: request.clubId },
          {
            isOfficialVerified: false,
            verifiedAt: null,
          },
        )
      }

      await verificationRequestRepository.update(
        { id: request.id },
        {
          status: decision.status,
          rejectReason: isRejected ? decision.reject_reason?.trim() ?? '' : '',
        },
      )

      return {
        request_id: requestId,
        club_uuid: request.clubId,
        status: decision.status,
        is_official_verified: isApproved,
        processed_at: processedAt,
      }
    })
  }
}
