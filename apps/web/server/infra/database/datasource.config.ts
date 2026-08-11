import type { DataSourceOptions } from 'typeorm'
import { SnakeNamingStrategy } from 'typeorm-naming-strategies'
import { ENV } from '../../ENV'
import {
  AccountEntity,
  AccountUserEntity,
  AnnouncementDismissEntity,
  AnnouncementEntity,
  AppVersionPolicyEntity,
  ClubEntity,
  ClubRecruitmentEntity,
  DeviceEntity,
  RegularMeetingEntity,
  ServiceUserEntity,
  TermsAgreementEntity,
  TermsEntity,
  UserActivityLogEntity,
  UserEntity,
  UserNotificationEntity,
} from './entities'
import { ClubHistoryEntity } from './entities/club-history.entity'
import { ClubManagerEntity } from './entities/club-manager.entity'
import { ClubManagerRegisterRequestEntity } from './entities/club-manager-register-request.entity'
import { ClubReviewKeywordEntity } from './entities/club-review-keyword.entity'
import { ClubVerificationRequestEntity } from './entities/club-verification-request.entity'
import { CollegeMajorEntity } from './entities/college-major.entity'
import { UserClubReviewEntity } from './entities/user-club-review.entity'
import { ClubReviewKeywordCategoryEntity } from './entities/user-club-review-category.entity'
import { UserRecentSearchEntity } from './entities/user-recent-search.entity'
import { UserSavedClubEntity } from './entities/user-saved-club.entity'
import { UserVoiceEntity } from './entities/user-voice.entity'

export const MAIN_DATA_SOURCE_OPTIONS: DataSourceOptions = {
  type: 'postgres',
  host: ENV.DB.HOST,
  port: ENV.DB.PORT,
  entities: [
    AccountEntity,
    UserEntity,
    AccountUserEntity,
    ServiceUserEntity,
    DeviceEntity,
    AppVersionPolicyEntity,
    AnnouncementEntity,
    AnnouncementDismissEntity,
    UserActivityLogEntity,
    ClubEntity,
    ClubRecruitmentEntity,
    RegularMeetingEntity,
    ClubReviewKeywordEntity,
    ClubReviewKeywordCategoryEntity,
    UserClubReviewEntity,
    UserSavedClubEntity,
    ClubManagerEntity,
    ClubManagerRegisterRequestEntity,
    ClubVerificationRequestEntity,
    ClubHistoryEntity,
    TermsEntity,
    TermsAgreementEntity,
    UserVoiceEntity,
    UserRecentSearchEntity,
    UserNotificationEntity,
    CollegeMajorEntity,
  ],
  username: ENV.DB.USERNAME,
  password: ENV.DB.PASSWORD,
  database: ENV.DB.DB_NAME,
  synchronize: false,
  namingStrategy: new SnakeNamingStrategy(),
  logging: false,
  extra: {
    connectionLimit: 20,
  },
}
