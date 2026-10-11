import { groupBy, toPairs } from 'lodash-es'
import { CATEGORIES } from 'server/domain/constants/club-categories'
import { normalizeClubRecruitType } from 'server/domain/constants/club-recruit-type'
import {
  PENDING_CLUB_STATUS,
  PUBLIC_CLUB_STATUS,
  REJECTED_CLUB_STATUS,
} from 'server/domain/constants/club-status'
import { MAX_OFFICIAL_VERIFICATION_RETRY_COUNT } from 'server/domain/constants/official-verification-status'
import { getOfficialVerificationTermKey } from 'server/domain/constants/official-verification-term'
import {
  type Club,
  type ClubDetail,
  type ClubDomainSource,
  type ManagedClubDetail,
  type ManagedClubListItem,
  type ReviewKeyword,
  toClubDetailDomain,
  toClubDomain,
} from 'server/domain/model/Club'
import type {
  ClubData,
  ClubManagerRequest,
  ClubManagerRequestPatch,
  ClubManagerRequestResponse,
  ClubRegisterRequest,
  ClubRegistrationManager,
  ManagedClubPatch,
} from 'server/http/schemas/managers'
import { In, IsNull, type Repository } from 'typeorm'
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../domain/error'
import type { ClubCategory } from '../domain/model/ClubCategory'
import {
  ClubEntity,
  UserActivityLogEntity,
  UserActivityLogType,
  UserNotificationEntity,
} from '../infra/database/entities'
import { ClubManagerEntity } from '../infra/database/entities/club-manager.entity'
import { ClubReviewKeywordEntity } from '../infra/database/entities/club-review-keyword.entity'
import { UserClubReviewEntity } from '../infra/database/entities/user-club-review.entity'
import type { Prisma, club as PrismaClub } from '../infra/database/generated/prisma/client'
import { getPrismaClient } from '../infra/database/prisma'
import { toClubDomainSource } from '../infra/database/prisma-club-mapping'
import {
  toDatabaseIdString,
  toNullableDateString,
  toNullableTimestampString,
  toStringArray,
  toTimestampString,
} from '../infra/database/prisma-mapping'
import { Inject, InjectRepository, Service } from '../provider'
import { sortEachRandom } from '../util/club-sort'
import { ClubAccessService } from './club-access.service'

type ClubUuid = string
type ReviewKeywordId = string
type ManagedClubListEntityItem = {
  club: PrismaClub
  managementStatus: ManagedClubListItem['managementStatus']
  managerRequestId?: number
}

@Service
export class ClubService {
  @InjectRepository(ClubEntity)
  private readonly clubRepository: Repository<ClubEntity>
  @InjectRepository(UserActivityLogEntity)
  private readonly userActivityLogRepository: Repository<UserActivityLogEntity>
  @InjectRepository(ClubReviewKeywordEntity)
  private readonly clubReviewKeywordRepository: Repository<ClubReviewKeywordEntity>
  @InjectRepository(UserClubReviewEntity)
  private readonly userClubReviewRepository: Repository<UserClubReviewEntity>
  @InjectRepository(ClubManagerEntity)
  private readonly clubManagerRepository: Repository<ClubManagerEntity>
  @Inject(ClubAccessService)
  private readonly clubAccessService: ClubAccessService

  async findByUuid(uuid: string): Promise<Club> {
    this.userActivityLogRepository
      .insert({
        type: UserActivityLogType.CALL_GET_CLUB_API,
        params: JSON.stringify({ uuid }),
      })
      .catch(console.error)
    const club = await this.clubAccessService.getExistingClub(uuid)
    const clubReview = await this.getClubReviews([club.uuid])
    return toClubDomain(club, clubReview.get(club.uuid))
  }

  async findPublicByUuid(uuid: string): Promise<ClubDetail> {
    this.userActivityLogRepository
      .insert({
        type: UserActivityLogType.CALL_GET_CLUB_API,
        params: JSON.stringify({ uuid }),
      })
      .catch(console.error)
    const club = await this.clubAccessService.getPublicClub(uuid)
    const [clubReview, verificationRequest] = await Promise.all([
      this.getClubReviews([club.uuid]),
      getPrismaClient().club_verification_request.findUnique({
        where: { club_id: club.uuid },
        select: { status: true },
      }),
    ])
    return toClubDetailDomain(club, clubReview.get(club.uuid), verificationRequest)
  }

  async getManagedClubByUuid(clubUuid: string, serviceUserId: string): Promise<ManagedClubDetail> {
    await this.clubAccessService.assertManagedClub(clubUuid, serviceUserId)
    const [club, managers, verificationRequest] = await Promise.all([
      this.clubAccessService.getExistingClub(clubUuid),
      getPrismaClient().club_manager.findMany({
        where: { club_id: clubUuid, deleted_at: null },
        select: { service_user_id: true, name: true, phone: true, student_id: true },
      }),
      getPrismaClient().club_verification_request.findUnique({
        where: { club_id: clubUuid },
        select: {
          id: true,
          status: true,
          term_key: true,
          attempt_no: true,
          reject_reason: true,
          created_at: true,
        },
      }),
    ])
    const verificationStatus = club.isOfficialVerified
      ? 'VERIFIED'
      : verificationRequest?.status === PENDING_CLUB_STATUS
        ? 'PENDING'
        : verificationRequest?.status === REJECTED_CLUB_STATUS
          ? 'REJECTED'
          : 'UNVERIFIED'
    const effectiveAttemptNo = verificationRequest
      ? verificationRequest.term_key === getOfficialVerificationTermKey()
        ? verificationRequest.attempt_no
        : 1
      : null
    const retryCount = Math.max((effectiveAttemptNo ?? 1) - 1, 0)

    return {
      ...toClubDomain(club),
      managers: managers.map((m) => ({
        serviceUserId: m.service_user_id,
        name: m.name,
        phone: m.phone,
        studentId: m.student_id,
      })),
      officialVerification: {
        status: verificationStatus,
        requestId: verificationRequest ? Number(verificationRequest.id) : null,
        attemptNo: effectiveAttemptNo,
        retryCount,
        retryLimit: MAX_OFFICIAL_VERIFICATION_RETRY_COUNT,
        remainingRetryCount: Math.max(MAX_OFFICIAL_VERIFICATION_RETRY_COUNT - retryCount, 0),
        rejectReason:
          verificationStatus === 'REJECTED' ? (verificationRequest?.reject_reason ?? null) : null,
        requestedAt: verificationRequest ? toTimestampString(verificationRequest.created_at) : null,
      },
    }
  }

  async findByCategory(category: string): Promise<Club[]> {
    this.userActivityLogRepository
      .insert({
        type: UserActivityLogType.CALL_LIST_CLUBS_OF_CATEGORY_API,
        params: JSON.stringify({ category }),
      })
      .catch(console.error)
    const rows = await getPrismaClient().club.findMany({
      where: { category, status: PUBLIC_CLUB_STATUS, deleted_at: null },
    })
    const [entities, clubReview] = await Promise.all([
      this.toPrismaClubSources(rows),
      this.getClubReviews(rows.map((it) => it.uuid)),
    ])
    const clubs = entities.map((it) => toClubDomain(it, clubReview.get(it.uuid)))
    return sortEachRandom(clubs)
  }

  async findAllManagedByUser(serviceUserId: string): Promise<ManagedClubListItem[]> {
    const prisma = getPrismaClient()
    const [clubManagers, managerRequests] = await Promise.all([
      prisma.club_manager.findMany({
        where: { service_user_id: serviceUserId, deleted_at: null },
        orderBy: { created_at: 'desc' },
        select: { club_id: true },
      }),
      prisma.club_manager_request.findMany({
        where: { service_user_id: serviceUserId },
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
        select: { id: true, club_id: true, status: true },
      }),
    ])
    const latestManagerRequestByClubId = new Map<string, (typeof managerRequests)[number]>()
    managerRequests.forEach((request) => {
      if (!latestManagerRequestByClubId.has(request.club_id)) {
        latestManagerRequestByClubId.set(request.club_id, request)
      }
    })
    const latestManagerRequests = Array.from(latestManagerRequestByClubId.values())

    const managerClubIds = clubManagers.map((it) => it.club_id)
    const managerRequestClubIds = latestManagerRequests
      .filter(
        (request) =>
          request.status === PENDING_CLUB_STATUS || request.status === REJECTED_CLUB_STATUS,
      )
      .map((it) => it.club_id)
    const clubIds = Array.from(new Set([...managerClubIds, ...managerRequestClubIds]))
    if (clubIds.length === 0) {
      return []
    }
    const [clubs, allClubManagers] = await Promise.all([
      prisma.club.findMany({
        where: { uuid: { in: clubIds }, deleted_at: null },
      }),
      prisma.club_manager.findMany({
        where: { club_id: { in: clubIds }, deleted_at: null },
        select: { club_id: true },
      }),
    ])
    const clubById = new Map(clubs.map((club) => [club.uuid, club]))
    const userManagedClubIdSet = new Set(managerClubIds)
    const clubIdWithManagerSet = new Set(allClubManagers.map((manager) => manager.club_id))

    const approvedManagedClubs = clubManagers
      .map((manager) => clubById.get(manager.club_id))
      .filter((club): club is PrismaClub => club?.status === PUBLIC_CLUB_STATUS)
    const latestRecruitmentUpdatedAtByClubId = await this.findLatestRecruitmentUpdatedAtByClubId(
      approvedManagedClubs.map((club) => club.uuid),
    )

    const getRepresentativeUpdatedAt = (club: PrismaClub) => {
      const latestRecruitmentUpdatedAt = latestRecruitmentUpdatedAtByClubId.get(club.uuid)
      if (!latestRecruitmentUpdatedAt) {
        return club.updated_at.getTime()
      }
      return Math.max(club.updated_at.getTime(), latestRecruitmentUpdatedAt)
    }

    const sortedApprovedManagedClubItems: ManagedClubListEntityItem[] = approvedManagedClubs
      .sort((a, b) => getRepresentativeUpdatedAt(b) - getRepresentativeUpdatedAt(a))
      .map((club) => ({
        club,
        managementStatus: PUBLIC_CLUB_STATUS,
      }))
    const rejectedManagedClubs = clubManagers
      .map((manager) => clubById.get(manager.club_id))
      .filter((club): club is PrismaClub => club?.status === REJECTED_CLUB_STATUS)
      .map(
        (club): ManagedClubListEntityItem => ({
          club,
          managementStatus: REJECTED_CLUB_STATUS,
        }),
      )
    const pendingManagedClubs = clubManagers
      .map((manager) => clubById.get(manager.club_id))
      .filter((club): club is PrismaClub => club?.status === PENDING_CLUB_STATUS)
      .map(
        (club): ManagedClubListEntityItem => ({
          club,
          managementStatus: PENDING_CLUB_STATUS,
        }),
      )
    const rejectedManagerRequestClubs = latestManagerRequests
      .filter(
        (request) =>
          request.status === REJECTED_CLUB_STATUS && !userManagedClubIdSet.has(request.club_id),
      )
      .map((request): ManagedClubListEntityItem | null => {
        const club = clubById.get(request.club_id)
        if (!club) {
          return null
        }
        return {
          club,
          managementStatus: 'MANAGER_REQUEST_REJECTED',
          managerRequestId: Number(request.id),
        }
      })
      .filter((item): item is ManagedClubListEntityItem => !!item)
    const pendingManagerRequestClubs = latestManagerRequests
      .filter((request) => request.status === PENDING_CLUB_STATUS)
      .filter((request) => !userManagedClubIdSet.has(request.club_id))
      .map((request): ManagedClubListEntityItem | null => {
        const club = clubById.get(request.club_id)
        if (!club) {
          return null
        }
        return {
          club,
          managementStatus: 'MANAGER_REQUEST_PENDING',
          managerRequestId: Number(request.id),
        }
      })
      .filter((item): item is ManagedClubListEntityItem => !!item)

    const orderedItems = [
      ...sortedApprovedManagedClubItems,
      ...rejectedManagedClubs,
      ...rejectedManagerRequestClubs,
      ...pendingManagedClubs,
      ...pendingManagerRequestClubs,
    ]
    const seenClubIds = new Set<string>()

    const uniqueItems = orderedItems.filter((item) => {
      if (seenClubIds.has(item.club.uuid)) {
        return false
      }
      seenClubIds.add(item.club.uuid)
      return true
    })
    const clubSources = await this.toPrismaClubSources(uniqueItems.map((item) => item.club))
    return uniqueItems.map((item, index) => ({
      ...toClubDomain(clubSources[index]),
      managementStatus: item.managementStatus,
      hasManager: clubIdWithManagerSet.has(item.club.uuid),
      ...(item.managerRequestId !== undefined && { managerRequestId: item.managerRequestId }),
    }))
  }

  private async findLatestRecruitmentUpdatedAtByClubId(
    clubIds: string[],
  ): Promise<Map<string, number>> {
    if (clubIds.length === 0) {
      return new Map()
    }

    const rows = await getPrismaClient().club_recruitment.groupBy({
      by: ['club_id'],
      where: { club_id: { in: clubIds }, deleted_at: null },
      _max: { updated_at: true },
    })

    return new Map(rows.map((row) => [row.club_id, row._max.updated_at?.getTime() ?? 0] as const))
  }

  async findClubsReviewedByMe(serviceUserId: string): Promise<Club[]> {
    const reviews = await getPrismaClient().user_club_review.findMany({
      where: { service_user_id: serviceUserId },
      select: { club_id: true },
    })
    return this.findPublicClubsByIds(reviews.map((it) => it.club_id))
  }

  async findMySavedClubs(serviceUserId: string): Promise<Club[]> {
    const saved = await getPrismaClient().user_saved_club.findMany({
      where: { service_user_id: serviceUserId },
      select: { club_id: true },
    })
    return this.findPublicClubsByIds(saved.map((it) => it.club_id))
  }

  async saveClubToMyCollection(serviceUserId: string, clubId: string) {
    await this.clubAccessService.getPublicClub(clubId)
    await getPrismaClient().user_saved_club.create({
      data: { service_user_id: serviceUserId, club_id: clubId },
    })
  }

  async unsaveClubFromMyCollection(serviceUserId: string, clubId: string) {
    await getPrismaClient().user_saved_club.deleteMany({
      where: { service_user_id: serviceUserId, club_id: clubId },
    })
  }

  async findLatestUploaded(topN = 20): Promise<Club[]> {
    const rows = await getPrismaClient().club.findMany({
      where: { status: PUBLIC_CLUB_STATUS, deleted_at: null },
      orderBy: { article_uploaded_at: { sort: 'desc', nulls: 'last' } },
      take: topN,
    })
    const [entities, clubReview] = await Promise.all([
      this.toPrismaClubSources(rows),
      this.getClubReviews(rows.map((it) => it.uuid)),
    ])
    return entities.map((it) => toClubDomain(it, clubReview.get(it.uuid)))
  }

  async findRandomRecommendations(limit = 10): Promise<Club[]> {
    const prisma = getPrismaClient()
    const randomIds = await prisma.$queryRaw<Array<{ uuid: string }>>`
      SELECT uuid FROM club
      WHERE status = ${PUBLIC_CLUB_STATUS} AND deleted_at IS NULL
      ORDER BY RANDOM()
      LIMIT ${limit}
    `
    if (randomIds.length === 0) {
      return []
    }
    const rows = await prisma.club.findMany({
      where: {
        uuid: { in: randomIds.map((it) => it.uuid) },
        status: PUBLIC_CLUB_STATUS,
        deleted_at: null,
      },
    })
    const rowById = new Map(rows.map((row) => [row.uuid, row]))
    const orderedRows = randomIds
      .map((it) => rowById.get(it.uuid))
      .filter((row): row is PrismaClub => !!row)
    const [entities, clubReview] = await Promise.all([
      this.toPrismaClubSources(orderedRows),
      this.getClubReviews(orderedRows.map((it) => it.uuid)),
    ])
    return entities.map((it) => toClubDomain(it, clubReview.get(it.uuid)))
  }

  private async findPublicClubsByIds(clubIds: string[]): Promise<Club[]> {
    const uniqueIds = Array.from(new Set(clubIds))
    if (uniqueIds.length === 0) {
      return []
    }
    const rows = await getPrismaClient().club.findMany({
      where: { uuid: { in: uniqueIds }, status: PUBLIC_CLUB_STATUS, deleted_at: null },
    })
    return (await this.toPrismaClubSources(rows)).map((it) => toClubDomain(it))
  }

  private async toPrismaClubSources(rows: PrismaClub[]): Promise<ClubDomainSource[]> {
    const majorIds = Array.from(
      new Set(rows.map((row) => row.college_major_id).filter((id): id is number => id !== null)),
    )
    const majors = majorIds.length
      ? await getPrismaClient().college_major.findMany({
          where: { id: { in: majorIds }, deleted_at: null },
          select: { id: true, college: true, major: true },
        })
      : []
    const majorById = new Map(majors.map((major) => [major.id, major]))
    return rows.map((row) =>
      toClubDomainSource(
        row,
        row.college_major_id === null ? null : (majorById.get(row.college_major_id) ?? null),
      ),
    )
  }

  async registerClub(serviceUserId: string, body: ClubRegisterRequest): Promise<Club> {
    const { club_data: club, manager_data: managerData } = body
    if (club.type === '교외') {
      throw new BadRequestError('현재 교외 동아리는 등록 신청이 불가능합니다.')
    }
    const affiliation = await this.resolveClubAffiliation(club.affiliation)

    return getPrismaClient().$transaction(async (tx) => {
      const created = await tx.club.create({
        data: {
          name: club.name,
          type: club.type,
          image_uri: club.image_uri ?? '',
          category: club.category,
          affiliation_type: affiliation.affiliationType,
          college_major_id: affiliation.collegeMajorId,
          short_description: club.short_description,
          recruit_type: normalizeClubRecruitType(club.recruit_type),
          min_activity_period: club.min_activity_period,
          has_dongbang: club.has_dongbang,
          dongbang_location: club.dongbang_location ?? '',
          sns_urls: club.sns_urls,
          introduction: club.introduction,
          activity_image_urls: club.activity_image_urls,
          status: PENDING_CLUB_STATUS,
          approved_at: null,
          reject_reason: '',
        },
      })
      await tx.club_manager.create({
        data: {
          club_id: created.uuid,
          service_user_id: serviceUserId,
          name: managerData.name,
          phone: managerData.phone,
          student_id: managerData.student_id,
        },
      })

      const collegeMajor =
        created.college_major_id === null
          ? null
          : await tx.college_major.findFirst({
              where: { id: created.college_major_id, deleted_at: null },
              select: { id: true, college: true, major: true },
            })

      return toClubDomain(toClubDomainSource(created, collegeMajor))
    })
  }

  async getClubRegistrationManager(
    clubUuid: string,
    serviceUserId: string,
  ): Promise<ClubRegistrationManager> {
    const prisma = getPrismaClient()
    const club = await prisma.club.findFirst({
      where: { uuid: clubUuid, deleted_at: null },
      select: { status: true },
    })
    if (!club) {
      throw new NotFoundError('club not found')
    }

    const clubManager = await prisma.club_manager.findFirst({
      where: { club_id: clubUuid, service_user_id: serviceUserId, deleted_at: null },
      select: { name: true, phone: true, student_id: true },
    })
    if (clubManager) {
      const managerRequest = await prisma.club_manager_request.findFirst({
        where: { club_id: clubUuid, service_user_id: serviceUserId },
        select: { id: true },
      })
      if (managerRequest) {
        throw new ForbiddenError('manager request is not a club registration')
      }
      this.assertEditableClubRegistrationStatus(club.status)

      return {
        name: clubManager.name,
        phone: clubManager.phone,
        student_id: clubManager.student_id,
      }
    }

    const anotherManager = await prisma.club_manager.findFirst({
      where: { club_id: clubUuid, deleted_at: null },
      select: { id: true },
    })
    if (anotherManager) {
      throw new ForbiddenError('club registration manager permission required')
    }
    throw new NotFoundError('club registration manager not found')
  }

  private assertEditableClubRegistrationStatus(status: string): void {
    if (status !== PENDING_CLUB_STATUS && status !== REJECTED_CLUB_STATUS) {
      throw new ConflictError('only pending or rejected club registrations can be edited')
    }
  }

  private async resolveClubAffiliation(
    affiliation: string,
  ): Promise<{ affiliationType: string; collegeMajorId: number | null }> {
    if (['중앙동아리', '연합동아리', '기타'].includes(affiliation)) {
      return {
        affiliationType: affiliation,
        collegeMajorId: null,
      }
    }

    const major = await getPrismaClient().college_major.findFirst({
      where: { major: affiliation, deleted_at: null },
      select: { id: true },
    })
    if (major) {
      return {
        affiliationType: '소속동아리',
        collegeMajorId: major.id,
      }
    }

    const college = await getPrismaClient().college_major.findFirst({
      where: { college: affiliation, major: null, deleted_at: null },
      select: { id: true },
    })
    if (college) {
      return {
        affiliationType: '소속동아리',
        collegeMajorId: college.id,
      }
    }

    throw new BadRequestError('유효하지 않은 동아리 소속입니다.')
  }

  async getCategories(): Promise<ClubCategory[]> {
    this.userActivityLogRepository
      .insert({
        type: UserActivityLogType.CALL_GET_CATEGORY_LIST_API,
        params: '{}',
      })
      .catch(console.error)
    return CATEGORIES
  }

  async getClubReviews(uuids: ClubUuid[]): Promise<
    Map<
      ClubUuid,
      {
        totalReviews: number
        reviewKeywords: ReviewKeyword[]
      }
    >
  > {
    if (uuids.length === 0) {
      return new Map()
    }
    const reviews = await this.userClubReviewRepository.find({
      where: {
        clubId: In(uuids),
      },
    })
    const clubToReviewKeywords: Map<
      ClubUuid,
      {
        totalReviews: number
        keywordUpvotes: Map<ReviewKeywordId, number>
      }
    > = this.clubToReviewKeywords(reviews)

    const keywords = await this.clubReviewKeywordRepository.find({
      order: {
        sortOrder: 'ASC',
      },
    })
    const out = uuids.map((uuid: ClubUuid) => {
      const { totalReviews, keywordUpvotes } = clubToReviewKeywords.get(uuid) ?? {
        totalReviews: 0,
        keywordUpvotes: new Map<ReviewKeywordId, number>(),
      }
      const reviewKeywords = keywords
        .map((it) => ({
          id: it.id,
          title: it.title,
          iconUri: it.iconUri,
          totalUpvotes: keywordUpvotes.get(it.id) ?? 0,
        }))
        // 리뷰가 있는 키워드만 반환하도록 수정함
        .filter((it) => it.totalUpvotes > 0)
        .sort((a, b) => b.totalUpvotes - a.totalUpvotes)
      return [uuid, { totalReviews, reviewKeywords }] as const
    })
    return new Map(out)
  }

  private clubToReviewKeywords(reviews: UserClubReviewEntity[]): Map<
    ClubUuid,
    {
      totalReviews: number
      keywordUpvotes: Map<ReviewKeywordId, number>
    }
  > {
    const out = toPairs(groupBy(reviews, (review) => review.clubId)).map(
      ([clubId, reviews]: [ClubUuid, UserClubReviewEntity[]]): [
        ClubUuid,
        {
          totalReviews: number
          keywordUpvotes: Map<ReviewKeywordId, number>
        },
      ] => {
        const keywordUpvotes = this.aggregateReviewKeywords(reviews)
        return [
          clubId,
          {
            totalReviews: reviews.length,
            keywordUpvotes,
          },
        ]
      },
    )
    return new Map(out)
  }

  private aggregateReviewKeywords(reviews: UserClubReviewEntity[]): Map<ReviewKeywordId, number> {
    return reviews.reduce((acc, cur) => {
      cur.reviewKeywordIds.forEach((keywordId) => {
        acc.set(keywordId, (acc.get(keywordId) ?? 0) + 1)
      })
      return acc
    }, new Map<ReviewKeywordId, number>())
  }

  async updateClub(uuid: string, club: Partial<ClubEntity>): Promise<boolean> {
    this.userActivityLogRepository
      .insert({
        type: UserActivityLogType.EDIT_CLUB,
        userDevice: '',
        params: JSON.stringify({
          uuid: uuid,
          club: club,
        }),
        userIp: '',
      })
      .catch(console.error)
    const updated = await this.clubRepository.update(
      {
        uuid: uuid,
      },
      club,
    )
    return !!updated.affected && updated.affected > 0
  }

  async patchManagedClub(
    clubUuid: string,
    serviceUserId: string,
    body: ManagedClubPatch,
  ): Promise<{ clubUuid: string; updatedAt: string }> {
    const clubPatch = body.club_data ? await this.buildClubPatchFromClubData(body.club_data) : {}
    if (Object.keys(clubPatch).length === 0 && !body.manager_data && !body.resubmit) {
      throw new BadRequestError('수정할 필드가 없습니다.')
    }

    return getPrismaClient().$transaction(
      async (tx) => {
        const lockedClubs = await tx.$queryRaw<Array<{ uuid: string }>>`
        SELECT uuid FROM club
        WHERE uuid = ${clubUuid}::uuid AND deleted_at IS NULL
        FOR UPDATE
      `
        if (lockedClubs.length === 0) {
          throw new NotFoundError('club not found')
        }
        const club = await tx.club.findFirst({
          where: { uuid: clubUuid, deleted_at: null },
        })
        if (!club) {
          throw new NotFoundError('club not found')
        }

        const clubManager = await tx.club_manager.findFirst({
          where: { club_id: clubUuid, service_user_id: serviceUserId, deleted_at: null },
          select: { id: true },
        })
        if (!clubManager) {
          throw new ForbiddenError('club manager permission required')
        }

        if (body.manager_data || body.resubmit) {
          const managerRequest = await tx.club_manager_request.findFirst({
            where: { club_id: clubUuid, service_user_id: serviceUserId },
            select: { id: true },
          })
          if (managerRequest) {
            throw new ForbiddenError('manager request is not a club registration')
          }
        }

        if (body.resubmit && club.status !== REJECTED_CLUB_STATUS) {
          throw new ConflictError('only rejected club registrations can be resubmitted')
        }
        if (club.status === REJECTED_CLUB_STATUS && !body.resubmit) {
          throw new ConflictError('rejected club registration requires resubmit')
        }

        if (body.manager_data) {
          this.assertEditableClubRegistrationStatus(club.status)

          await tx.club_manager.update({
            where: { id: clubManager.id },
            data: {
              ...(body.manager_data.name !== undefined && { name: body.manager_data.name }),
              ...(body.manager_data.phone !== undefined && { phone: body.manager_data.phone }),
              ...(body.manager_data.student_id !== undefined && {
                student_id: body.manager_data.student_id,
              }),
              updated_at: new Date(),
            },
          })
        }

        const statusPatch = body.resubmit ? { status: PENDING_CLUB_STATUS, reject_reason: '' } : {}
        const patchWithStatus = {
          ...clubPatch,
          ...statusPatch,
        }
        const shouldRecordHistory = club.status === PUBLIC_CLUB_STATUS
        const beforeData = shouldRecordHistory ? this.toClubHistoryData(club) : null
        if (Object.keys(patchWithStatus).length > 0) {
          await tx.club.update({
            where: { uuid: clubUuid },
            data: { ...patchWithStatus, updated_at: new Date() },
          })
        }

        if (body.resubmit && club.status === REJECTED_CLUB_STATUS) {
          await tx.user_notification.deleteMany({
            where: {
              source_type: 'CLUB',
              source_id: clubUuid,
              type: 'CLUB_REGISTRATION_REJECTED',
            },
          })
        }

        const updatedClub = await tx.club.findFirst({
          where: { uuid: clubUuid, deleted_at: null },
        })
        if (!updatedClub) {
          throw new NotFoundError('club not found')
        }
        if (shouldRecordHistory && beforeData) {
          const afterData = this.toClubHistoryData(updatedClub)
          const changedFields = Object.keys(patchWithStatus).filter(
            (key) => beforeData[key] !== afterData[key],
          )

          await tx.club_history.create({
            data: {
              club_id: clubUuid,
              service_user_id: serviceUserId,
              before_data: beforeData,
              after_data: afterData,
              changed_fields: changedFields,
            },
          })
        }

        return {
          clubUuid,
          updatedAt: toTimestampString(updatedClub.updated_at),
        }
      },
      { timeout: 30_000 },
    )
  }

  async deleteManagedClub(clubUuid: string, serviceUserId: string): Promise<void> {
    await getPrismaClient().$transaction(async (tx) => {
      const club = await tx.club.findFirst({
        where: { uuid: clubUuid, deleted_at: null },
        select: { status: true },
      })
      if (!club) {
        throw new NotFoundError('club not found')
      }

      const clubManager = await tx.club_manager.findFirst({
        where: { club_id: clubUuid, service_user_id: serviceUserId, deleted_at: null },
        select: { id: true },
      })
      if (!clubManager) {
        throw new ForbiddenError('club manager permission required')
      }

      if (club.status !== PENDING_CLUB_STATUS && club.status !== REJECTED_CLUB_STATUS) {
        throw new ConflictError('only pending or rejected clubs can be deleted')
      }

      await tx.user_notification.deleteMany({
        where: {
          source_type: 'CLUB',
          source_id: clubUuid,
          type: { in: ['CLUB_REGISTRATION_APPROVED', 'CLUB_REGISTRATION_REJECTED'] },
        },
      })
      const deletedAt = new Date()
      await tx.club_manager.updateMany({
        where: { club_id: clubUuid, deleted_at: null },
        data: { deleted_at: deletedAt, updated_at: deletedAt },
      })
      await tx.club.updateMany({
        where: { uuid: clubUuid, deleted_at: null },
        data: { deleted_at: deletedAt, updated_at: deletedAt },
      })
    })
  }

  private async buildClubPatchFromClubData(
    body: Partial<ClubData>,
  ): Promise<Prisma.clubUncheckedUpdateInput> {
    const patch: Prisma.clubUncheckedUpdateInput = {}

    if (body.name !== undefined) {
      patch.name = body.name
    }
    if (body.type !== undefined) {
      if (body.type === '교외') {
        throw new BadRequestError('현재 교외 동아리는 등록 신청이 불가능합니다.')
      }
      patch.type = body.type
    }
    if (body.image_uri !== undefined) {
      patch.image_uri = body.image_uri
    }
    if (body.category !== undefined) {
      patch.category = body.category
    }
    if (body.affiliation !== undefined) {
      const affiliation = await this.resolveClubAffiliation(body.affiliation)
      patch.affiliation_type = affiliation.affiliationType
      patch.college_major_id = affiliation.collegeMajorId
    }
    if (body.short_description !== undefined) {
      patch.short_description = body.short_description
    }
    if (body.recruit_type !== undefined) {
      patch.recruit_type = normalizeClubRecruitType(body.recruit_type)
    }
    if (body.min_activity_period !== undefined) {
      patch.min_activity_period = body.min_activity_period
    }
    if (body.has_dongbang !== undefined) {
      patch.has_dongbang = body.has_dongbang
    }
    if (body.dongbang_location !== undefined) {
      patch.dongbang_location = body.dongbang_location
    }
    if (body.sns_urls !== undefined) {
      patch.sns_urls = body.sns_urls
    }
    if (body.introduction !== undefined) {
      patch.introduction = body.introduction
    }
    if (body.activity_image_urls !== undefined) {
      patch.activity_image_urls = body.activity_image_urls
    }

    return patch
  }

  private toClubHistoryData(club: PrismaClub): Prisma.InputJsonObject {
    return {
      uuid: club.uuid,
      name: club.name,
      description: club.description,
      short_description: club.short_description,
      type: club.type,
      category: club.category,
      affiliation_type: club.affiliation_type,
      college_major_id: club.college_major_id,
      image_uri: club.image_uri,
      article: club.article,
      article_uploaded_at: toNullableTimestampString(club.article_uploaded_at),
      has_dongbang: club.has_dongbang,
      dongbang_location: club.dongbang_location,
      min_activity_period: club.min_activity_period,
      active_member_count: club.active_member_count,
      founded_at: toNullableDateString(club.founded_at),
      recruit_type: club.recruit_type,
      is_official_verified: club.is_official_verified,
      verified_at: toNullableTimestampString(club.verified_at),
      sns_urls: toStringArray(club.sns_urls),
      activity_image_urls: toStringArray(club.activity_image_urls),
      introduction: club.introduction,
      created_at: toTimestampString(club.created_at),
      updated_at: toTimestampString(club.updated_at),
      deleted_at: toNullableTimestampString(club.deleted_at),
      approved_at: toNullableTimestampString(club.approved_at),
      status: club.status,
      reject_reason: club.reject_reason,
    }
  }

  async createClubManagerRequest(
    clubUuid: string,
    serviceUserId: string,
    request: ClubManagerRequest,
  ): Promise<void> {
    await this.clubAccessService.getExistingClub(clubUuid)

    await getPrismaClient().$transaction(async (tx) => {
      const existingManager = await tx.club_manager.findFirst({
        where: { club_id: clubUuid, deleted_at: null },
        select: { id: true },
      })
      if (existingManager) {
        throw new ConflictError('club already has a manager')
      }

      const pendingRequest = await tx.club_manager_request.findFirst({
        where: {
          club_id: clubUuid,
          service_user_id: serviceUserId,
          status: PENDING_CLUB_STATUS,
        },
        select: { id: true },
      })
      if (pendingRequest) {
        throw new ConflictError('pending manager request already exists')
      }

      const rejectedRequest = await tx.club_manager_request.findFirst({
        where: {
          club_id: clubUuid,
          service_user_id: serviceUserId,
          status: REJECTED_CLUB_STATUS,
        },
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
        select: { id: true },
      })

      if (rejectedRequest) {
        await tx.club_manager_request.update({
          where: { id: rejectedRequest.id },
          data: {
            status: PENDING_CLUB_STATUS,
            reject_reason: '',
            name: request.name,
            phone: request.phone,
            student_id: request.student_id,
            created_at: new Date(),
          },
        })
        await tx.user_notification.deleteMany({
          where: {
            source_type: 'CLUB_MANAGER_REQUEST',
            source_id: toDatabaseIdString(rejectedRequest.id),
            type: 'MANAGER_REQUEST_REJECTED',
          },
        })
        return
      }

      await tx.club_manager_request.create({
        data: {
          service_user_id: serviceUserId,
          club_id: clubUuid,
          name: request.name,
          phone: request.phone,
          student_id: request.student_id,
        },
      })
    })
  }

  async getClubManagerRequest(
    clubUuid: string,
    serviceUserId: string,
  ): Promise<ClubManagerRequestResponse> {
    const prisma = getPrismaClient()
    const pendingRequest = await prisma.club_manager_request.findFirst({
      where: {
        club_id: clubUuid,
        service_user_id: serviceUserId,
        status: PENDING_CLUB_STATUS,
      },
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      select: { name: true, phone: true, student_id: true },
    })

    const managerRequest =
      pendingRequest ??
      (await prisma.club_manager_request.findFirst({
        where: {
          club_id: clubUuid,
          service_user_id: serviceUserId,
          status: REJECTED_CLUB_STATUS,
        },
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
        select: { name: true, phone: true, student_id: true },
      }))

    if (!managerRequest) {
      throw new NotFoundError('editable manager request not found')
    }

    return {
      name: managerRequest.name,
      phone: managerRequest.phone,
      student_id: managerRequest.student_id,
    }
  }

  async deleteClubManagerRequest(clubUuid: string, serviceUserId: string): Promise<void> {
    await getPrismaClient().$transaction(async (tx) => {
      const requests = await tx.club_manager_request.findMany({
        where: {
          club_id: clubUuid,
          service_user_id: serviceUserId,
          status: { in: [PENDING_CLUB_STATUS, REJECTED_CLUB_STATUS] },
        },
        select: { id: true },
      })
      if (requests.length === 0) {
        throw new NotFoundError('cancellable manager request not found')
      }

      const requestIds = requests.map((request) => request.id)
      await tx.user_notification.deleteMany({
        where: {
          source_type: 'CLUB_MANAGER_REQUEST',
          source_id: { in: requestIds.map(toDatabaseIdString) },
          type: 'MANAGER_REQUEST_REJECTED',
        },
      })
      await tx.club_manager_request.deleteMany({
        where: { id: { in: requestIds } },
      })
    })
  }

  async updateClubManagerRequest(
    clubUuid: string,
    serviceUserId: string,
    request: ClubManagerRequestPatch,
  ): Promise<void> {
    await getPrismaClient().$transaction(
      async (tx) => {
        const targetStatus = request.resubmit ? REJECTED_CLUB_STATUS : PENDING_CLUB_STATUS
        const managerRequests = await tx.$queryRaw<Array<{ id: bigint }>>`
        SELECT id FROM club_manager_request
        WHERE club_id = ${clubUuid}::uuid
          AND service_user_id = ${serviceUserId}::uuid
          AND status = ${targetStatus}
        ORDER BY created_at DESC, id DESC
        LIMIT 1 FOR UPDATE
      `
        const managerRequest = managerRequests[0]
        if (!managerRequest) {
          throw new NotFoundError(
            request.resubmit
              ? 'rejected manager request not found'
              : 'pending manager request not found',
          )
        }

        await tx.club_manager_request.update({
          where: { id: managerRequest.id },
          data: {
            ...(request.name !== undefined && { name: request.name }),
            ...(request.phone !== undefined && { phone: request.phone }),
            ...(request.student_id !== undefined && { student_id: request.student_id }),
            ...(request.resubmit && {
              status: PENDING_CLUB_STATUS,
              reject_reason: '',
              created_at: new Date(),
            }),
          },
        })

        if (request.resubmit) {
          await tx.user_notification.deleteMany({
            where: {
              source_type: 'CLUB_MANAGER_REQUEST',
              source_id: toDatabaseIdString(managerRequest.id),
              type: 'MANAGER_REQUEST_REJECTED',
            },
          })
        }
      },
      { timeout: 30_000 },
    )
  }

  async registerClubManager(serviceUserId: string, clubUuid: string) {
    await this.clubAccessService.getExistingClub(clubUuid)
    const exist = await this.clubManagerRepository.findOneBy({ serviceUserId, clubId: clubUuid })
    if (exist) {
      return
    }
    await this.clubManagerRepository.insert({ serviceUserId, clubId: clubUuid })
  }
}
