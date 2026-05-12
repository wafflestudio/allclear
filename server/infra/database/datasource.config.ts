import { DataSourceOptions } from 'typeorm'
import { SnakeNamingStrategy } from 'typeorm-naming-strategies'
import {
  AccountEntity,
  AccountUserEntity,
  AnnouncementDismissEntity,
  AnnouncementEntity,
  ClubEntity,
  ClubRecruitmentEntity,
  RegularMeetingEntity,
  DeviceEntity,
  ServiceUserEntity,
  TermsAgreementEntity,
  TermsEntity,
  UserActivityLogEntity,
  UserEntity,
} from './entities'
import { ENV } from '../../ENV'
import { ClubReviewKeywordEntity } from './entities/club-review-keyword.entity'
import { UserClubReviewEntity } from './entities/user-club-review.entity'
import { ClubManagerEntity } from './entities/club-manager.entity'
import { ClubReviewKeywordCategoryEntity } from './entities/user-club-review-category.entity'
import { UserVoiceEntity } from './entities/user-voice.entity'
import { UserSavedClubEntity } from './entities/user-saved-club.entity'
import { CollegeMajorEntity } from './entities/college-major.entity'
import { ClubManagerRegisterRequestEntity } from './entities/club-manager-register-request.entity'
import { ClubManagerRegisterRequestEntityV1 } from './entities/v1/club-manager-register-request.entity'
import { ClubHistoryEntity } from './entities/club-history.entity'
import { ClubVerificationRequestEntity } from './entities/club-verification-request.entity'

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
    ClubManagerRegisterRequestEntityV1,
    ClubVerificationRequestEntity,
    ClubHistoryEntity,
    TermsEntity,
    TermsAgreementEntity,
    UserVoiceEntity,
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
