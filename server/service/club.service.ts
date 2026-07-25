import { In, IsNull, Repository } from 'typeorm'
import { Inject, InjectRepository, Service } from '../provider'
import {
  ClubEntity,
  ClubHistoryEntity,
  ClubRecruitmentEntity,
  UserActivityLogEntity,
  UserActivityLogType,
  UserNotificationEntity,
} from '../infra/database/entities'
import { ClubCategory } from '../domain/model/ClubCategory'
import { CATEGORIES } from '../../src/fixtures/category'
import {
  Club,
  ManagedClubDetail,
  ManagedClubListItem,
  ReviewKeyword,
  toClubDomain,
} from 'server/domain/model/Club'
import { ClubReviewKeywordEntity } from '../infra/database/entities/club-review-keyword.entity'
import { UserClubReviewEntity } from '../infra/database/entities/user-club-review.entity'
import { groupBy, round, toPairs } from 'lodash-es'
import { ClubManagerEntity } from '../infra/database/entities/club-manager.entity'
import { UserSavedClubEntity } from '../infra/database/entities/user-saved-club.entity'
import { ClubManagerRegisterRequestEntity } from '../infra/database/entities/club-manager-register-request.entity'
import dayjs from 'dayjs'
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../domain/error'
import { sortByPopularAndEachRandom } from '../util/club-sort'
import {
  PENDING_CLUB_STATUS,
  PUBLIC_CLUB_STATUS,
  REJECTED_CLUB_STATUS,
} from 'src/common/constants/club-status'
import { normalizeClubRecruitType } from 'src/common/constants/club-recruit-type'
import type {
  ClubData,
  ClubManagerRequest,
  ClubManagerRequestPatch,
  ClubManagerRequestResponse,
  ClubRegistrationManager,
  ClubRegisterRequest,
  ManagedClubPatch,
} from 'src/lib/schemas/managers'
import { CollegeMajorEntity } from '../infra/database/entities/college-major.entity'
import { ClubAccessService } from './club-access.service'
import { getClubResubmissionStatusPatch } from './club-registration-status'

type ClubUuid = string
type ReviewKeywordId = string
type ManagedClubListEntityItem = {
  club: ClubEntity
  managementStatus: ManagedClubListItem['managementStatus']
  managerRequestId?: number
}

const CLUB_ENTITY_FIELD_TO_COLUMN: Record<string, string> = {
  name: 'name',
  type: 'type',
  imageUri: 'image_uri',
  category: 'category',
  shortDescription: 'short_description',
  recruitType: 'recruit_type',
  minActivityPeriod: 'min_activity_period',
  hasDongbang: 'has_dongbang',
  dongbangLocation: 'dongbang_location',
  affiliationType: 'affiliation_type',
  collegeMajorId: 'college_major_id',
  snsUrls: 'sns_urls',
  activityImageUrls: 'activity_image_urls',
  introduction: 'introduction',
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
  @InjectRepository(UserSavedClubEntity)
  private readonly userSavedClubRepository: Repository<UserSavedClubEntity>
  @InjectRepository(ClubManagerEntity)
  private readonly clubManagerRepository: Repository<ClubManagerEntity>
  @InjectRepository(ClubManagerRegisterRequestEntity)
  private readonly clubManagerRegisterRequestRepository: Repository<ClubManagerRegisterRequestEntity>
  @InjectRepository(CollegeMajorEntity)
  private readonly collegeMajorRepository: Repository<CollegeMajorEntity>
  @InjectRepository(ClubHistoryEntity)
  private readonly clubHistoryRepository: Repository<ClubHistoryEntity>
  @InjectRepository(ClubRecruitmentEntity)
  private readonly clubRecruitmentRepository: Repository<ClubRecruitmentEntity>
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

  async findPublicByUuid(uuid: string): Promise<Club> {
    this.userActivityLogRepository
      .insert({
        type: UserActivityLogType.CALL_GET_CLUB_API,
        params: JSON.stringify({ uuid }),
      })
      .catch(console.error)
    const club = await this.clubAccessService.getPublicClub(uuid)
    const clubReview = await this.getClubReviews([club.uuid])
    return toClubDomain(club, clubReview.get(club.uuid))
  }

  async findByAuthKey(authkey: string): Promise<Club> {
    const club = await this.clubRepository.findOneByOrFail({
      authkey,
      deletedAt: IsNull(),
    })
    return toClubDomain(club)
  }

  async getManagedClubByUuid(clubUuid: string, serviceUserId: string): Promise<ManagedClubDetail> {
    await this.clubAccessService.assertManagedClub(clubUuid, serviceUserId)
    const [club, managers] = await Promise.all([
      this.clubAccessService.getExistingClub(clubUuid),
      this.clubManagerRepository.findBy({ clubId: clubUuid }),
    ])
    return {
      ...toClubDomain(club),
      managers: managers.map((m) => ({
        serviceUserId: m.serviceUserId,
        name: m.name,
        phone: m.phone,
        studentId: m.studentId,
      })),
    }
  }

  async findByCategory(category: string): Promise<Club[]> {
    this.userActivityLogRepository
      .insert({
        type: UserActivityLogType.CALL_LIST_CLUBS_OF_CATEGORY_API,
        params: JSON.stringify({ category }),
      })
      .catch(console.error)
    const entities = await this.clubRepository.findBy({
      category,
      status: PUBLIC_CLUB_STATUS,
      deletedAt: IsNull(),
    })
    const clubReview = await this.getClubReviews(entities.map((it) => it.uuid))
    const clubs = entities.map((it) => toClubDomain(it, clubReview.get(it.uuid)))
    return sortByPopularAndEachRandom(clubs)
  }

  async findAllManagedByUser(serviceUserId: string): Promise<ManagedClubListItem[]> {
    const [clubManagers, managerRequests] = await Promise.all([
      this.clubManagerRepository.find({
        where: {
          serviceUserId,
        },
        order: {
          createdAt: 'DESC',
        },
      }),
      this.clubManagerRegisterRequestRepository.find({
        where: {
          serviceUserId,
        },
        order: {
          createdAt: 'DESC',
          id: 'DESC',
        },
      }),
    ])
    const latestManagerRequestByClubId = new Map<string, ClubManagerRegisterRequestEntity>()
    managerRequests.forEach((request) => {
      if (!latestManagerRequestByClubId.has(request.clubId)) {
        latestManagerRequestByClubId.set(request.clubId, request)
      }
    })
    const latestManagerRequests = Array.from(latestManagerRequestByClubId.values())

    const managerClubIds = clubManagers.map((it) => it.clubId)
    const managerRequestClubIds = latestManagerRequests
      .filter(
        (request) =>
          request.status === PENDING_CLUB_STATUS || request.status === REJECTED_CLUB_STATUS,
      )
      .map((it) => it.clubId)
    const clubIds = Array.from(new Set([...managerClubIds, ...managerRequestClubIds]))
    if (clubIds.length === 0) {
      return []
    }
    const [clubs, allClubManagers] = await Promise.all([
      this.clubRepository.findBy({
        uuid: In(clubIds),
        deletedAt: IsNull(),
      }),
      this.clubManagerRepository.find({
        select: { clubId: true },
        where: { clubId: In(clubIds) },
      }),
    ])
    const clubById = new Map(clubs.map((club) => [club.uuid, club]))
    const userManagedClubIdSet = new Set(managerClubIds)
    const clubIdWithManagerSet = new Set(allClubManagers.map((manager) => manager.clubId))

    const approvedManagedClubs = clubManagers
      .map((manager) => clubById.get(manager.clubId))
      .filter((club): club is ClubEntity => club?.status === PUBLIC_CLUB_STATUS)
    const latestRecruitmentUpdatedAtByClubId = await this.findLatestRecruitmentUpdatedAtByClubId(
      approvedManagedClubs.map((club) => club.uuid),
    )

    const getRepresentativeUpdatedAt = (club: ClubEntity) => {
      const latestRecruitmentUpdatedAt = latestRecruitmentUpdatedAtByClubId.get(club.uuid)
      if (!latestRecruitmentUpdatedAt) {
        return new Date(club.updatedAt).getTime()
      }
      return Math.max(new Date(club.updatedAt).getTime(), latestRecruitmentUpdatedAt)
    }

    const sortedApprovedManagedClubItems: ManagedClubListEntityItem[] = approvedManagedClubs
      .sort((a, b) => getRepresentativeUpdatedAt(b) - getRepresentativeUpdatedAt(a))
      .map((club) => ({
        club,
        managementStatus: PUBLIC_CLUB_STATUS,
      }))
    const rejectedManagedClubs = clubManagers
      .map((manager) => clubById.get(manager.clubId))
      .filter((club): club is ClubEntity => club?.status === REJECTED_CLUB_STATUS)
      .map(
        (club): ManagedClubListEntityItem => ({
          club,
          managementStatus: REJECTED_CLUB_STATUS,
        }),
      )
    const pendingManagedClubs = clubManagers
      .map((manager) => clubById.get(manager.clubId))
      .filter((club): club is ClubEntity => club?.status === PENDING_CLUB_STATUS)
      .map(
        (club): ManagedClubListEntityItem => ({
          club,
          managementStatus: PENDING_CLUB_STATUS,
        }),
      )
    const rejectedManagerRequestClubs = latestManagerRequests
      .filter(
        (request) =>
          request.status === REJECTED_CLUB_STATUS && !userManagedClubIdSet.has(request.clubId),
      )
      .map((request): ManagedClubListEntityItem | null => {
        const club = clubById.get(request.clubId)
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
      .filter((request) => !userManagedClubIdSet.has(request.clubId))
      .map((request): ManagedClubListEntityItem | null => {
        const club = clubById.get(request.clubId)
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

    return orderedItems
      .filter((item) => {
        if (seenClubIds.has(item.club.uuid)) {
          return false
        }
        seenClubIds.add(item.club.uuid)
        return true
      })
      .map((item) => ({
        ...toClubDomain(item.club),
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

    const rows = await this.clubRecruitmentRepository
      .createQueryBuilder('recruitment')
      .select('recruitment.club_id', 'club_id')
      .addSelect('MAX(recruitment.updated_at)', 'latest_updated_at')
      .where('recruitment.club_id IN (:...clubIds)', { clubIds })
      .andWhere('recruitment.deleted_at IS NULL')
      .groupBy('recruitment.club_id')
      .getRawMany<{ club_id: string; latest_updated_at: string }>()

    return new Map(
      rows.map((row) => [row.club_id, new Date(row.latest_updated_at).getTime()] as const),
    )
  }

  async findClubsReviewedByMe(serviceUserId: string): Promise<Club[]> {
    const clubReviews = await this.userClubReviewRepository.findBy({ serviceUserId })
    const clubIds = Array.from(new Set(clubReviews.map((it) => it.clubId)))
    const club = await this.clubRepository.findBy({
      uuid: In(clubIds),
      status: PUBLIC_CLUB_STATUS,
      deletedAt: IsNull(),
    })
    return club.map((it) => toClubDomain(it))
  }

  async findMySavedClubs(serviceUserId: string): Promise<Club[]> {
    const savedClubs = await this.userSavedClubRepository.findBy({ serviceUserId })
    const clubIds = Array.from(new Set(savedClubs.map((it) => it.clubId)))
    const club = await this.clubRepository.findBy({
      uuid: In(clubIds),
      status: PUBLIC_CLUB_STATUS,
      deletedAt: IsNull(),
    })
    return club.map((it) => toClubDomain(it))
  }

  async saveClubToMyCollection(serviceUserId: string, clubId: string) {
    await this.clubAccessService.getPublicClub(clubId)
    await this.userSavedClubRepository.insert({ serviceUserId, clubId })
  }

  async unsaveClubFromMyCollection(serviceUserId: string, clubId: string) {
    await this.userSavedClubRepository.delete({ serviceUserId, clubId })
  }

  async findPopular(): Promise<Club[]> {
    this.userActivityLogRepository
      .insert({
        type: UserActivityLogType.CALL_LIST_POPULAR_CLUBS_API,
        params: '{}',
      })
      .catch(console.error)
    const entities = await this.clubRepository.findBy({
      isPopular: true,
      status: PUBLIC_CLUB_STATUS,
      deletedAt: IsNull(),
    })
    const clubReview = await this.getClubReviews(entities.map((it) => it.uuid))
    const clubs = entities.map((it) => toClubDomain(it, clubReview.get(it.uuid)))
    return sortByPopularAndEachRandom(clubs)
  }

  async findLatestUploaded(topN = 20): Promise<Club[]> {
    const entities = await this.clubRepository.find({
      where: {
        status: PUBLIC_CLUB_STATUS,
        deletedAt: IsNull(),
      },
      order: {
        articleUploadedAt: {
          direction: 'DESC',
          nulls: 'LAST',
        },
      },
      take: topN,
    })
    const clubReview = await this.getClubReviews(entities.map((it) => it.uuid))
    return entities.map((it) => toClubDomain(it, clubReview.get(it.uuid)))
  }

  async findRandomRecommendations(limit = 10): Promise<Club[]> {
    const entities = await this.clubRepository
      .createQueryBuilder('club')
      .where('club.status = :status', { status: PUBLIC_CLUB_STATUS })
      .andWhere('club.deleted_at IS NULL')
      .orderBy('RANDOM()')
      .take(limit)
      .getMany()

    const clubReview = await this.getClubReviews(entities.map((it) => it.uuid))
    return entities.map((it) => toClubDomain(it, clubReview.get(it.uuid)))
  }

  async registerClub(serviceUserId: string, body: ClubRegisterRequest): Promise<Club> {
    const { club_data: club, manager_data: managerData } = body
    const clubPatch = await this.buildClubPatchFromClubData(club)

    return this.clubRepository.manager.transaction(async (manager) => {
      const clubRepository = manager.getRepository(ClubEntity)
      const clubManagerRepository = manager.getRepository(ClubManagerEntity)

      const entity = clubRepository.create({
        ...clubPatch,
        status: PENDING_CLUB_STATUS,
        approvedAt: null,
        rejectReason: '',
      })

      const created = await clubRepository.save(entity)
      await clubManagerRepository.insert({
        clubId: created.uuid,
        serviceUserId,
        name: managerData.name,
        phone: managerData.phone,
        studentId: managerData.student_id,
      })

      const savedClub = await clubRepository.findOneByOrFail({
        uuid: created.uuid,
        deletedAt: IsNull(),
      })

      return toClubDomain(savedClub)
    })
  }

  async getClubRegistrationManager(
    clubUuid: string,
    serviceUserId: string,
  ): Promise<ClubRegistrationManager> {
    const club = await this.clubRepository.findOneBy({
      uuid: clubUuid,
      deletedAt: IsNull(),
    })
    if (!club) {
      throw new NotFoundError('club not found')
    }

    const clubManager = await this.getOwnedRegistrationManager(
      this.clubManagerRepository,
      this.clubManagerRegisterRequestRepository,
      clubUuid,
      serviceUserId,
    )
    this.assertEditableClubRegistrationStatus(club.status)

    return {
      name: clubManager.name,
      phone: clubManager.phone,
      student_id: clubManager.studentId,
    }
  }

  private async getOwnedRegistrationManager(
    clubManagerRepository: Repository<ClubManagerEntity>,
    clubManagerRegisterRequestRepository: Repository<ClubManagerRegisterRequestEntity>,
    clubUuid: string,
    serviceUserId: string,
  ): Promise<ClubManagerEntity> {
    const clubManager = await clubManagerRepository.findOneBy({
      clubId: clubUuid,
      serviceUserId,
    })
    if (clubManager) {
      const managerRequest = await clubManagerRegisterRequestRepository.findOneBy({
        clubId: clubUuid,
        serviceUserId,
      })
      if (managerRequest) {
        throw new ForbiddenError('manager request is not a club registration')
      }
      return clubManager
    }

    const anotherManager = await clubManagerRepository.findOneBy({
      clubId: clubUuid,
    })
    if (anotherManager) {
      throw new ForbiddenError('club registration manager permission required')
    }
    throw new NotFoundError('club registration manager not found')
  }

  private assertEditableClubRegistrationStatus(status: ClubEntity['status']): void {
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

    const major = await this.collegeMajorRepository.findOne({
      where: {
        major: affiliation,
      },
    })
    if (major) {
      return {
        affiliationType: '소속동아리',
        collegeMajorId: major.id,
      }
    }

    const college = await this.collegeMajorRepository.findOne({
      where: {
        college: affiliation,
        major: IsNull(),
      },
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
        avgRating: number
        reviewKeywords: ReviewKeyword[]
        latestComment: string
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
    const clubToRatingKeywords: Map<
      ClubUuid,
      {
        totalReviews: number
        avgRating: number
        latestComment: string
        keywordUpvotes: Map<ReviewKeywordId, number>
      }
    > = this.clubToRatingKeywords(reviews)

    const keywords = await this.clubReviewKeywordRepository.find({
      order: {
        sortOrder: 'ASC',
      },
    })
    const out = uuids.map((uuid: ClubUuid) => {
      const { totalReviews, avgRating, latestComment, keywordUpvotes } = clubToRatingKeywords.get(
        uuid,
      ) ?? {
        totalReviews: 0,
        avgRating: 0,
        latestComment: '',
        keywordUpvotes: new Map<ReviewKeywordId, number>(),
      }
      const reviewKeywords = keywords
        .map((it) => ({
          id: it.id,
          title: it.title,
          color: it.color,
          iconUri: it.iconUri,
          totalUpvotes: keywordUpvotes.get(it.id) ?? 0,
        }))
        // 리뷰가 있는 키워드만 반환하도록 수정함
        .filter((it) => it.totalUpvotes > 0)
        .sort((a, b) => b.totalUpvotes - a.totalUpvotes)
      return [uuid, { totalReviews, avgRating, reviewKeywords, latestComment }] as const
    })
    return new Map(out)
  }

  private clubToRatingKeywords(reviews: UserClubReviewEntity[]): Map<
    ClubUuid,
    {
      totalReviews: number
      avgRating: number
      latestComment: string
      keywordUpvotes: Map<ReviewKeywordId, number>
    }
  > {
    const out = toPairs(groupBy(reviews, (review) => review.clubId)).map(
      ([clubId, reviews]: [ClubUuid, UserClubReviewEntity[]]): [
        ClubUuid,
        {
          totalReviews: number
          avgRating: number
          latestComment: string
          keywordUpvotes: Map<ReviewKeywordId, number>
        },
      ] => {
        const { totalRatings, sumRatings, keywordUpvotes } = this.aggregate(reviews)
        return [
          clubId,
          {
            totalReviews: reviews.length,
            avgRating: totalRatings > 0 ? round(sumRatings / totalRatings, 1) : 0,
            latestComment:
              reviews
                .filter((it) => it.content.length > 0)
                .sort((a, b) => (dayjs(a.updatedAt).isBefore(b.updatedAt) ? 1 : -1))[0]?.content ??
              '',
            keywordUpvotes,
          },
        ]
      },
    )
    return new Map(out)
  }

  private aggregate(reviews: UserClubReviewEntity[]): {
    totalRatings: number
    sumRatings: number
    keywordUpvotes: Map<ReviewKeywordId, number>
  } {
    return reviews.reduce(
      (acc, cur) => {
        if (cur.rating > 0) {
          acc.totalRatings += 1
          acc.sumRatings += cur.rating
        }
        cur.reviewKeywordIds.forEach((keywordId) => {
          acc.keywordUpvotes.set(keywordId, (acc.keywordUpvotes.get(keywordId) ?? 0) + 1)
        })
        return acc
      },
      { totalRatings: 0, sumRatings: 0, keywordUpvotes: new Map<ReviewKeywordId, number>() },
    )
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

    return this.clubRepository.manager.transaction(async (manager) => {
      const clubRepository = manager.getRepository(ClubEntity)
      const clubManagerRepository = manager.getRepository(ClubManagerEntity)
      const clubManagerRegisterRequestRepository = manager.getRepository(
        ClubManagerRegisterRequestEntity,
      )
      const clubHistoryRepository = manager.getRepository(ClubHistoryEntity)
      const userNotificationRepository = manager.getRepository(UserNotificationEntity)

      const club = await clubRepository.findOne({
        where: {
          uuid: clubUuid,
          deletedAt: IsNull(),
        },
        loadEagerRelations: false,
        lock: {
          mode: 'pessimistic_write',
        },
      })
      if (!club) {
        throw new NotFoundError('club not found')
      }

      const clubManager = await clubManagerRepository.findOneBy({
        clubId: clubUuid,
        serviceUserId,
      })
      if (!clubManager) {
        throw new ForbiddenError('club manager permission required')
      }

      if (body.manager_data || body.resubmit) {
        const managerRequest = await clubManagerRegisterRequestRepository.findOneBy({
          clubId: clubUuid,
          serviceUserId,
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

        await clubManagerRepository.update(
          { id: clubManager.id },
          {
            ...(body.manager_data.name !== undefined && { name: body.manager_data.name }),
            ...(body.manager_data.phone !== undefined && { phone: body.manager_data.phone }),
            ...(body.manager_data.student_id !== undefined && {
              studentId: body.manager_data.student_id,
            }),
          },
        )
      }

      const statusPatch = body.resubmit ? getClubResubmissionStatusPatch(club.status) : {}
      const patchWithStatus = {
        ...clubPatch,
        ...statusPatch,
      }
      const shouldRecordHistory = club.status === PUBLIC_CLUB_STATUS
      const beforeData = shouldRecordHistory ? this.toClubHistoryData(club) : null
      if (Object.keys(patchWithStatus).length > 0) {
        await clubRepository.update(
          {
            uuid: clubUuid,
            deletedAt: IsNull(),
          },
          patchWithStatus,
        )
      }

      if (body.resubmit && club.status === REJECTED_CLUB_STATUS) {
        await userNotificationRepository.delete({
          sourceType: 'CLUB',
          sourceId: clubUuid,
          type: 'CLUB_REGISTRATION_REJECTED',
        })
      }

      const updatedClub = await clubRepository.findOneByOrFail({
        uuid: clubUuid,
        deletedAt: IsNull(),
      })
      if (shouldRecordHistory && beforeData) {
        const afterData = this.toClubHistoryData(updatedClub)
        const changedFields = Object.keys(patchWithStatus)
          .map((key) => CLUB_ENTITY_FIELD_TO_COLUMN[key] ?? key)
          .filter((key) => beforeData[key] !== afterData[key])

        await clubHistoryRepository.insert({
          clubId: clubUuid,
          serviceUserId,
          beforeData: beforeData as any,
          afterData: afterData as any,
          changedFields,
        })
      }

      return {
        clubUuid,
        updatedAt: updatedClub.updatedAt,
      }
    })
  }

  async deleteManagedClub(clubUuid: string, serviceUserId: string): Promise<void> {
    await this.clubRepository.manager.transaction(async (manager) => {
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

      const clubManager = await clubManagerRepository.findOneBy({
        clubId: clubUuid,
        serviceUserId,
      })
      if (!clubManager) {
        throw new ForbiddenError('club manager permission required')
      }

      if (club.status !== PENDING_CLUB_STATUS && club.status !== REJECTED_CLUB_STATUS) {
        throw new ConflictError('only pending or rejected clubs can be deleted')
      }

      await userNotificationRepository.delete({
        sourceType: 'CLUB',
        sourceId: clubUuid,
        type: In(['CLUB_REGISTRATION_APPROVED', 'CLUB_REGISTRATION_REJECTED']),
      })
      await clubManagerRepository.softDelete({
        clubId: clubUuid,
      })
      await clubRepository.softDelete({
        uuid: clubUuid,
      })
    })
  }

  private async buildClubPatchFromClubData(body: Partial<ClubData>): Promise<Partial<ClubEntity>> {
    const patch: Partial<ClubEntity> = {}

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
      patch.imageUri = body.image_uri
    }
    if (body.category !== undefined) {
      patch.category = body.category
    }
    if (body.affiliation !== undefined) {
      const affiliation = await this.resolveClubAffiliation(body.affiliation)
      patch.affiliationType = affiliation.affiliationType
      patch.collegeMajorId = affiliation.collegeMajorId
    }
    if (body.short_description !== undefined) {
      patch.shortDescription = body.short_description
    }
    if (body.recruit_type !== undefined) {
      patch.recruitType = normalizeClubRecruitType(body.recruit_type)
    }
    if (body.min_activity_period !== undefined) {
      patch.minActivityPeriod = body.min_activity_period
    }
    if (body.has_dongbang !== undefined) {
      patch.hasDongbang = body.has_dongbang
    }
    if (body.dongbang_location !== undefined) {
      patch.dongbangLocation = body.dongbang_location
    }
    if (body.sns_urls !== undefined) {
      patch.snsUrls = body.sns_urls
    }
    if (body.introduction !== undefined) {
      patch.introduction = body.introduction
    }
    if (body.activity_image_urls !== undefined) {
      patch.activityImageUrls = body.activity_image_urls
    }

    return patch
  }

  private toClubHistoryData(club: ClubEntity): Record<string, unknown> {
    return {
      uuid: club.uuid,
      name: club.name,
      full_name: club.fullName,
      description: club.description,
      short_description: club.shortDescription,
      type: club.type,
      category: club.category,
      college: club.college,
      affiliation_type: club.affiliationType,
      college_major_id: club.collegeMajorId,
      image_uri: club.imageUri,
      thumbnail_uri: club.thumbnailUri,
      tags: club.tags,
      article: club.article,
      article_uploaded_at: club.articleUploadedAt,
      is_popular: club.isPopular,
      has_dongbang: club.hasDongbang,
      dongbang_location: club.dongbangLocation,
      activity_cycle: club.activityCycle,
      min_activity_period: club.minActivityPeriod,
      active_member_count: club.activeMemberCount,
      founded_at: club.foundedAt,
      membership_fee: club.membershipFee,
      recruit_type: club.recruitType,
      is_official_verified: club.isOfficialVerified,
      verified_at: club.verifiedAt,
      sns_urls: club.snsUrls,
      activity_image_urls: club.activityImageUrls,
      introduction: club.introduction,
      blur_image: club.blurImage,
      blur_hash: club.blurHash,
      created_at: club.createdAt,
      updated_at: club.updatedAt,
      deleted_at: club.deletedAt,
      approved_at: club.approvedAt,
      status: club.status,
      reject_reason: club.rejectReason,
    }
  }

  async clubManagerRegisterRequest(
    serviceUserId: string,
    {
      clubId,
      name,
      phone,
      studentId,
    }: { clubId: string; name: string; phone: string; studentId: string },
  ) {
    await this.clubAccessService.getExistingClub(clubId)
    await this.clubManagerRegisterRequestRepository.insert({
      serviceUserId,
      clubId,
      name,
      phone,
      studentId,
    })
  }

  async createClubManagerRequest(
    clubUuid: string,
    serviceUserId: string,
    request: ClubManagerRequest,
  ): Promise<void> {
    await this.clubAccessService.getExistingClub(clubUuid)

    await this.clubManagerRegisterRequestRepository.manager.transaction(async (manager) => {
      const clubManagerRepository = manager.getRepository(ClubManagerEntity)
      const managerRequestRepository = manager.getRepository(ClubManagerRegisterRequestEntity)
      const userNotificationRepository = manager.getRepository(UserNotificationEntity)

      const existingManager = await clubManagerRepository.findOneBy({
        clubId: clubUuid,
      })
      if (existingManager) {
        throw new ConflictError('club already has a manager')
      }

      const pendingRequest = await managerRequestRepository.findOneBy({
        clubId: clubUuid,
        serviceUserId,
        status: PENDING_CLUB_STATUS,
      })
      if (pendingRequest) {
        throw new ConflictError('pending manager request already exists')
      }

      const rejectedRequest = await managerRequestRepository.findOne({
        where: {
          clubId: clubUuid,
          serviceUserId,
          status: REJECTED_CLUB_STATUS,
        },
        order: {
          createdAt: 'DESC',
          id: 'DESC',
        },
      })

      if (rejectedRequest) {
        await managerRequestRepository.update(
          { id: rejectedRequest.id },
          {
            status: PENDING_CLUB_STATUS,
            rejectReason: '',
            name: request.name,
            phone: request.phone,
            studentId: request.student_id,
            createdAt: new Date().toISOString(),
          },
        )
        await userNotificationRepository.delete({
          sourceType: 'CLUB_MANAGER_REQUEST',
          sourceId: rejectedRequest.id,
          type: 'MANAGER_REQUEST_REJECTED',
        })
        return
      }

      await managerRequestRepository.insert({
        serviceUserId,
        clubId: clubUuid,
        name: request.name,
        phone: request.phone,
        studentId: request.student_id,
      })
    })
  }

  async getClubManagerRequest(
    clubUuid: string,
    serviceUserId: string,
  ): Promise<ClubManagerRequestResponse> {
    const pendingRequest = await this.clubManagerRegisterRequestRepository.findOne({
      where: {
        clubId: clubUuid,
        serviceUserId,
        status: PENDING_CLUB_STATUS,
      },
      order: {
        createdAt: 'DESC',
        id: 'DESC',
      },
    })

    const managerRequest =
      pendingRequest ??
      (await this.clubManagerRegisterRequestRepository.findOne({
        where: {
          clubId: clubUuid,
          serviceUserId,
          status: REJECTED_CLUB_STATUS,
        },
        order: {
          createdAt: 'DESC',
          id: 'DESC',
        },
      }))

    if (!managerRequest) {
      throw new NotFoundError('editable manager request not found')
    }

    return {
      name: managerRequest.name,
      phone: managerRequest.phone,
      student_id: managerRequest.studentId,
    }
  }

  async deleteClubManagerRequest(clubUuid: string, serviceUserId: string): Promise<void> {
    await this.clubManagerRegisterRequestRepository.manager.transaction(async (manager) => {
      const managerRequestRepository = manager.getRepository(ClubManagerRegisterRequestEntity)
      const userNotificationRepository = manager.getRepository(UserNotificationEntity)

      const requests = await managerRequestRepository.findBy({
        clubId: clubUuid,
        serviceUserId,
        status: In([PENDING_CLUB_STATUS, REJECTED_CLUB_STATUS]),
      })
      if (requests.length === 0) {
        throw new NotFoundError('cancellable manager request not found')
      }

      const requestIds = requests.map((request) => request.id)
      await userNotificationRepository.delete({
        sourceType: 'CLUB_MANAGER_REQUEST',
        sourceId: In(requestIds),
        type: 'MANAGER_REQUEST_REJECTED',
      })
      await managerRequestRepository.delete({
        id: In(requestIds),
      })
    })
  }

  async updateClubManagerRequest(
    clubUuid: string,
    serviceUserId: string,
    request: ClubManagerRequestPatch,
  ): Promise<void> {
    await this.clubManagerRegisterRequestRepository.manager.transaction(async (manager) => {
      const managerRequestRepository = manager.getRepository(ClubManagerRegisterRequestEntity)
      const userNotificationRepository = manager.getRepository(UserNotificationEntity)
      const targetStatus = request.resubmit ? REJECTED_CLUB_STATUS : PENDING_CLUB_STATUS
      const managerRequest = await managerRequestRepository.findOne({
        where: {
          clubId: clubUuid,
          serviceUserId,
          status: targetStatus,
        },
        order: {
          createdAt: 'DESC',
          id: 'DESC',
        },
        lock: {
          mode: 'pessimistic_write',
        },
      })
      if (!managerRequest) {
        throw new NotFoundError(
          request.resubmit
            ? 'rejected manager request not found'
            : 'pending manager request not found',
        )
      }

      await managerRequestRepository.update(
        { id: managerRequest.id },
        {
          ...(request.name !== undefined && { name: request.name }),
          ...(request.phone !== undefined && { phone: request.phone }),
          ...(request.student_id !== undefined && { studentId: request.student_id }),
          ...(request.resubmit && {
            status: PENDING_CLUB_STATUS,
            rejectReason: '',
            createdAt: new Date().toISOString(),
          }),
        },
      )

      if (request.resubmit) {
        await userNotificationRepository.delete({
          sourceType: 'CLUB_MANAGER_REQUEST',
          sourceId: managerRequest.id,
          type: 'MANAGER_REQUEST_REJECTED',
        })
      }
    })
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
