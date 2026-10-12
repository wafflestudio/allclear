import type { ClubStatus } from 'server/domain/constants/club-status'
import type { ClubDomainSource } from 'server/domain/model/Club'
import type { club as PrismaClub } from './generated/prisma/client'
import { toNullableDateString, toNullableTimestampString, toStringArray } from './prisma-mapping'

/** Add the college major relation fields expected by the club domain mapper. */
export function toClubDomainSource(
  club: PrismaClub,
  collegeMajor: ClubDomainSource['collegeMajor'],
): ClubDomainSource {
  return {
    uuid: club.uuid,
    name: club.name,
    description: club.description,
    shortDescription: club.short_description,
    introduction: club.introduction,
    type: club.type,
    category: club.category,
    affiliationType: club.affiliation_type,
    collegeMajorId: club.college_major_id,
    collegeMajor,
    recruitType: club.recruit_type,
    isOfficialVerified: club.is_official_verified,
    verifiedAt: toNullableTimestampString(club.verified_at),
    hasDongbang: club.has_dongbang,
    dongbangLocation: club.dongbang_location,
    minActivityPeriod: club.min_activity_period,
    activeMemberCount: club.active_member_count,
    foundedAt: toNullableDateString(club.founded_at),
    snsUrls: toStringArray(club.sns_urls),
    activityImageUrls: toStringArray(club.activity_image_urls),
    imageUri: club.image_uri,
    article: club.article,
    articleUploadedAt: toNullableTimestampString(club.article_uploaded_at),
    status: club.status as ClubStatus,
    rejectReason: club.reject_reason,
  }
}
