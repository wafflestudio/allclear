import { ILike, In, IsNull, Raw, Repository } from 'typeorm'
import { InjectRepository, Service } from 'server/provider'
import { ClubEntity, UserActivityLogEntity, UserActivityLogType } from 'server/infra/database/entities'
import { ClubCategory } from 'server/domain/model/ClubCategory'
import { CATEGORIES } from 'src/fixtures/category'
import { ReviewKeyword } from 'server/domain/model/Club'
import { ENV } from 'server/ENV'
import { ClubReviewKeywordEntity } from 'server/infra/database/entities/club-review-keyword.entity'
import { UserClubReviewEntity } from 'server/infra/database/entities/user-club-review.entity'
import { groupBy, round, toPairs } from 'lodash-es'
import { ClubManagerEntity } from 'server/infra/database/entities/club-manager.entity'
import { UserSavedClubEntity } from 'server/infra/database/entities/user-saved-club.entity'
import { ClubManagerRegisterRequestEntityV1 } from 'server/infra/database/entities/v1/club-manager-register-request.entity'
import dayjs from 'dayjs'
import leven from 'leven'
import { NotFoundError } from 'server/domain/error'

export type V1Club = {
  id: string
  uuid: string
  name: string
  fullName: string
  description: string
  introduction: string
  type: string
  category: string
  college: string
  recruitType: string
  isPopular: boolean
  hasDongbang: boolean
  activityCycle: string
  membershipFee: string
  tags: string[]
  imageUri: string
  blurHash: string | null
  article: string
  articleUploadedAt: string | null
  avgRating: number
  totalReviews: number
  reviewKeywords: ReviewKeyword[]
  latestComment: string
}

const encodeV1ImageUri = (imageUri: string | undefined): string => {
  if (!imageUri) {
    return ''
  }
  const splitter = '%2F'
  const parts = imageUri.split(splitter)
  const lastPart = parts.pop() ?? ''
  return `${parts.join(splitter)}${splitter}${encodeURIComponent(lastPart)}`
}

const toV1ClubDomain = (
  it: ClubEntity,
  review?: {
    totalReviews: number
    avgRating: number
    reviewKeywords: ReviewKeyword[]
    latestComment: string
  },
): V1Club => ({
  id: it.uuid,
  uuid: it.uuid,
  name: it.name,
  fullName: it.fullName,
  description: it.description,
  introduction: it.introduction ?? '',
  type: it.type,
  category: it.category,
  college: it.college ?? '',
  recruitType: it.recruitType ?? '',
  isPopular: it.isPopular,
  hasDongbang: it.hasDongbang,
  activityCycle: it.activityCycle ?? '',
  membershipFee: it.membershipFee ?? '',
  tags: it.tags,
  imageUri: encodeV1ImageUri(it.imageUri) || ENV.R2.DEFAULT_CLUB_IMAGE,
  blurHash: it.blurHash,
  article: it.article ?? '',
  articleUploadedAt: it.articleUploadedAt,
  avgRating: review?.avgRating ?? 0,
  totalReviews: review?.totalReviews ?? 0,
  reviewKeywords: review?.reviewKeywords ?? [],
  latestComment: review?.latestComment ?? '',
})

type ClubUuid = string
type ReviewKeywordId = string
const sortByPopularAndEachRandom = (clubs: V1Club[]) =>
  clubs.sort((a, b) => {
    if (a.isPopular && !b.isPopular) {
      return -1
    }
    if (!a.isPopular && b.isPopular) {
      return 1
    }
    return (
      Math.random() - 0.5 + (a.imageUri && !b.imageUri ? -0.2 : !a.imageUri && b.imageUri ? 0.2 : 0)
    )
  })

@Service
export class ClubServiceV1 {
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
  @InjectRepository(ClubManagerRegisterRequestEntityV1)
  private readonly clubManagerRegisterRequestRepository: Repository<ClubManagerRegisterRequestEntityV1>

  async findByUuid(uuid: string): Promise<V1Club> {
    this.userActivityLogRepository
      .insert({
        type: UserActivityLogType.CALL_GET_CLUB_API,
        params: JSON.stringify({ uuid }),
      })
      .catch(console.error)
    const club = await this.clubRepository.findOneByOrFail({
      uuid,
    })
    const clubReview = await this.getClubReviews([club.uuid])
    return toV1ClubDomain(club, clubReview.get(club.uuid))
  }

  async findByAuthKey(authkey: string): Promise<V1Club> {
    const club = await this.clubRepository.findOneByOrFail({
      authkey,
    })
    return toV1ClubDomain(club)
  }

  async getManagedClubByUuid(clubUuid: string, serviceUserId: string): Promise<V1Club> {
    // check permission
    await this.clubManagerRepository.findOneByOrFail({
      clubId: clubUuid,
      serviceUserId,
    })
    const club = await this.clubRepository.findOneByOrFail({
      uuid: clubUuid,
    })
    return toV1ClubDomain(club)
  }

  async findByCategory(category: string): Promise<V1Club[]> {
    this.userActivityLogRepository
      .insert({
        type: UserActivityLogType.CALL_LIST_CLUBS_OF_CATEGORY_API,
        params: JSON.stringify({ category }),
      })
      .catch(console.error)
    const entities = await this.clubRepository.findBy({
      category,
    })
    const clubReview = await this.getClubReviews(entities.map((it) => it.uuid))
    const clubs = entities.map((it) => toV1ClubDomain(it, clubReview.get(it.uuid)))
    return sortByPopularAndEachRandom(clubs)
  }

  async findAllManagedByUser(serviceUserId: string): Promise<V1Club[]> {
    const clubManagers = await this.clubManagerRepository.findBy({
      serviceUserId,
    })
    const clubs = await this.clubRepository.findBy({
      uuid: In(clubManagers.map((it) => it.clubId)),
    })
    return clubs.map((it) => toV1ClubDomain(it))
  }

  async findClubsReviewedByMe(serviceUserId: string): Promise<V1Club[]> {
    const clubReviews = await this.userClubReviewRepository.findBy({ serviceUserId })
    const clubIds = Array.from(new Set(clubReviews.map((it) => it.clubId)))
    const club = await this.clubRepository.findBy({
      uuid: In(clubIds),
    })
    return club.map((it) => toV1ClubDomain(it))
  }

  async findMySavedClubs(serviceUserId: string): Promise<V1Club[]> {
    const savedClubs = await this.userSavedClubRepository.findBy({ serviceUserId })
    const clubIds = Array.from(new Set(savedClubs.map((it) => it.clubId)))
    const club = await this.clubRepository.findBy({
      uuid: In(clubIds),
    })
    return club.map((it) => toV1ClubDomain(it))
  }

  async saveClubToMyCollection(serviceUserId: string, clubId: string) {
    await this.userSavedClubRepository.insert({ serviceUserId, clubId })
  }

  async unsaveClubFromMyCollection(serviceUserId: string, clubId: string) {
    await this.userSavedClubRepository.delete({ serviceUserId, clubId })
  }

  async findPopular(): Promise<V1Club[]> {
    this.userActivityLogRepository
      .insert({
        type: UserActivityLogType.CALL_LIST_POPULAR_CLUBS_API,
        params: '{}',
      })
      .catch(console.error)
    const entities = await this.clubRepository.findBy({
      isPopular: true,
    })
    const clubReview = await this.getClubReviews(entities.map((it) => it.uuid))
    const clubs = entities.map((it) => toV1ClubDomain(it, clubReview.get(it.uuid)))
    return sortByPopularAndEachRandom(clubs)
  }

  async findLatestUploaded(topN = 20): Promise<V1Club[]> {
    const entities = await this.clubRepository.find({
      order: {
        articleUploadedAt: {
          direction: 'DESC',
          nulls: 'LAST',
        },
      },
      take: topN,
    })
    const clubReview = await this.getClubReviews(entities.map((it) => it.uuid))
    return entities.map((it) => toV1ClubDomain(it, clubReview.get(it.uuid)))
  }

  async search(query: string): Promise<V1Club[]> {
    this.userActivityLogRepository
      .insert({
        type: UserActivityLogType.CALL_SEARCH_CLUBS_API,
        params: JSON.stringify({ query }),
      })
      .catch(console.error)
    const entities = await this.clubRepository.find({
      where: [
        {
          // name ILIKE '%query%'
          name: ILike(`%${query}%`),
          deletedAt: IsNull(),
        },
        {
          // full_name ILIKE '%query%'
          fullName: ILike(`%${query}%`),
          deletedAt: IsNull(),
        },
        {
          // ARRAY_TO_STRING(tags, ',') ILIKE '%query%'
          tags: Raw((tagsAlias) => `ARRAY_TO_STRING(${tagsAlias}, ',') ILIKE :query`, {
            query: `%${query}%`,
          }),
          deletedAt: IsNull(),
        },
      ],
    })
    const clubReview = await this.getClubReviews(entities.map((it) => it.uuid))
    const clubs = entities.map((it) => toV1ClubDomain(it, clubReview.get(it.uuid)))
    return sortByPopularAndEachRandom(clubs)
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

  private async getClubReviews(uuids: ClubUuid[]): Promise<
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

  async clubManagerRegisterRequest(
    serviceUserId: string,
    { clubId, clubName }: { clubId?: string; clubName?: string },
  ) {
    await this.clubManagerRegisterRequestRepository.insert({ serviceUserId, clubId, clubName })
  }

  async findCandidatesByName(clubName: string | undefined, total = 5): Promise<V1Club[]> {
    const clubs = await this.clubRepository.find()
    let out = clubs.filter(
      (it) => it.name.includes(clubName ?? '') || it.fullName.includes(clubName ?? ''),
    )
    if (out.length < total) {
      const candidiates = this.similarByEditDistance(
        clubs.filter((it) => !out.includes(it)),
        clubName,
        total,
      )
      out = [...out, ...candidiates]
    }
    return out.slice(0, total).map((it) => toV1ClubDomain(it))
  }

  private similarByEditDistance(
    clubEntities: ClubEntity[],
    clubName: string | undefined,
    total: number,
  ): ClubEntity[] {
    return clubEntities
      .map((it) => ({
        entity: it,
        distance: leven(it.name, clubName ?? ''),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, total)
      .map((it) => it.entity)
  }

  async registerClubManager(serviceUserId: string, clubUuid: string) {
    const club = await this.clubRepository.findOneBy({ uuid: clubUuid })
    if (!club) {
      throw new NotFoundError('club not found')
    }
    const exist = await this.clubManagerRepository.findOneBy({ serviceUserId, clubId: clubUuid })
    if (exist) {
      return
    }
    await this.clubManagerRepository.insert({ serviceUserId, clubId: clubUuid })
  }
}
