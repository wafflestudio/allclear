import { In, IsNull, Repository } from 'typeorm'
import { Inject, InjectRepository, Service } from '../provider'
import {
  ClubEntity,
  ClubHistoryEntity,
  UserActivityLogEntity,
  UserActivityLogType,
} from '../infra/database/entities'
import { ClubCategory } from '../domain/model/ClubCategory'
import { CATEGORIES } from '../../src/fixtures/category'
import { Club, ManagedClubDetail, ReviewKeyword, toClubDomain } from 'server/domain/model/Club'
import { ClubReviewKeywordEntity } from '../infra/database/entities/club-review-keyword.entity'
import { UserClubReviewEntity } from '../infra/database/entities/user-club-review.entity'
import { groupBy, round, toPairs } from 'lodash-es'
import { ClubManagerEntity } from '../infra/database/entities/club-manager.entity'
import { UserSavedClubEntity } from '../infra/database/entities/user-saved-club.entity'
import { ClubManagerRegisterRequestEntity } from '../infra/database/entities/club-manager-register-request.entity'
import dayjs from 'dayjs'
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../domain/error'
import { sortByPopularAndEachRandom } from '../util/club-sort'
import { PENDING_CLUB_STATUS, PUBLIC_CLUB_STATUS } from 'src/common/constants/club-status'
import { normalizeClubRecruitType } from 'src/common/constants/club-recruit-type'
import type {
  ClubData,
  ClubManagerRequest,
  ClubRegisterRequest,
  ManagedClubPatch,
} from 'src/lib/schemas/managers'
import { CollegeMajorEntity } from '../infra/database/entities/college-major.entity'
import { ClubAccessService } from './club-access.service'

type ClubUuid = string
type ReviewKeywordId = string

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
  sns: 'sns',
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

  async findAllManagedByUser(serviceUserId: string): Promise<Club[]> {
    const clubManagers = await this.clubManagerRepository.findBy({
      serviceUserId,
    })
    const clubs = await this.clubRepository.findBy({
      uuid: In(clubManagers.map((it) => it.clubId)),
      deletedAt: IsNull(),
    })
    return clubs.map((it) => toClubDomain(it))
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

  async registerClub(
    serviceUserId: string,
    body: ClubRegisterRequest,
  ): Promise<Club> {
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
    const patch = await this.buildClubPatchFromClubData(body)
    if (Object.keys(patch).length === 0) {
      throw new BadRequestError('수정할 필드가 없습니다.')
    }

    return this.clubRepository.manager.transaction(async (manager) => {
      const clubRepository = manager.getRepository(ClubEntity)
      const clubManagerRepository = manager.getRepository(ClubManagerEntity)
      const clubHistoryRepository = manager.getRepository(ClubHistoryEntity)

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

      const beforeData = this.toClubHistoryData(club)
      await clubRepository.update(
        {
          uuid: clubUuid,
          deletedAt: IsNull(),
        },
        patch,
      )

      const updatedClub = await clubRepository.findOneByOrFail({
        uuid: clubUuid,
        deletedAt: IsNull(),
      })
      const afterData = this.toClubHistoryData(updatedClub)
      const changedFields = Object.keys(patch)
        .map((key) => CLUB_ENTITY_FIELD_TO_COLUMN[key] ?? key)
        .filter((key) => beforeData[key] !== afterData[key])

      await clubHistoryRepository.insert({
        clubId: clubUuid,
        serviceUserId,
        beforeData: beforeData as any,
        afterData: afterData as any,
        changedFields,
      })

      return {
        clubUuid,
        updatedAt: updatedClub.updatedAt,
      }
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
    if (body.sns !== undefined) {
      patch.sns = body.sns
    }
    if (body.introduction !== undefined) {
      patch.introduction = body.introduction
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
      membership_fee: club.membershipFee,
      recruit_type: club.recruitType,
      is_official_verified: club.isOfficialVerified,
      verified_at: club.verifiedAt,
      sns: club.sns,
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

    const existingManager = await this.clubManagerRepository.findOneBy({
      clubId: clubUuid,
    })
    if (existingManager) {
      throw new ConflictError('club already has a manager')
    }

    const pendingRequest = await this.clubManagerRegisterRequestRepository.findOneBy({
      clubId: clubUuid,
      serviceUserId,
      status: 'PENDING',
    })
    if (pendingRequest) {
      throw new ConflictError('pending manager request already exists')
    }

    await this.clubManagerRegisterRequestRepository.insert({
      serviceUserId,
      clubId: clubUuid,
      name: request.name,
      phone: request.phone,
      studentId: request.student_id,
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
