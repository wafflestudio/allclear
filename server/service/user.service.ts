import { IsNull, Not, Repository } from 'typeorm'
import { InjectRepository, Service } from '../provider'
import {
  AccountEntity,
  AccountUserEntity,
  DeviceEntity,
  ServiceUserEntity,
  UserActivityLogEntity,
  UserActivityLogType,
  UserEntity,
  UserRecentSearchEntity,
  UserVoiceEntity,
} from '../infra/database/entities'
import { User } from '../domain/model/User'
import { ForbiddenError, UserNotFoundError } from '../domain/error'
import { UserRole } from '../infra/database/entities/user-role.enum'
import { UpdateProfileDto } from '../../src/lib/schemas/users'
import { CollegeMajor } from '../domain/model/CollegeMajor'
import { CollegeMajorEntity } from '../infra/database/entities/college-major.entity'

const RECENT_SEARCH_LIMIT = 8

@Service
export class UserService {
  @InjectRepository(AccountEntity)
  private readonly accountRepository: Repository<AccountEntity>
  @InjectRepository(AccountUserEntity)
  private readonly accountUserRepository: Repository<AccountUserEntity>
  @InjectRepository(UserEntity)
  private readonly userRepository: Repository<UserEntity>
  @InjectRepository(ServiceUserEntity)
  private readonly serviceUserRepository: Repository<ServiceUserEntity>
  @InjectRepository(DeviceEntity)
  private readonly deviceRepository: Repository<DeviceEntity>
  @InjectRepository(UserVoiceEntity)
  private readonly userVoiceRepository: Repository<UserVoiceEntity>
  @InjectRepository(UserActivityLogEntity)
  private readonly userActivityLogRepository: Repository<UserActivityLogEntity>
  @InjectRepository(CollegeMajorEntity)
  private readonly collegeMajorRepository: Repository<CollegeMajorEntity>
  @InjectRepository(UserRecentSearchEntity)
  private readonly userRecentSearchRepository: Repository<UserRecentSearchEntity>

  public async getUserByAccountId(accountId: string): Promise<User> {
    if (!accountId) {
      throw new UserNotFoundError(`User not found`)
    }
    const account = await this.accountRepository.findOneBy({
      id: accountId,
    })
    if (!account) {
      throw new UserNotFoundError(`Account not found`)
    }
    const accountUser = await this.accountUserRepository.findOne({
      where: {
        accountId,
      },
      relations: ['user'],
    })
    if (!accountUser) {
      throw new UserNotFoundError(`AccountUser not found`)
    }
    if (!accountUser.user?.serviceUser) {
      // 유저가 회원탈퇴를 한 경우 account는 남아있고 해당 서비스의 user만 soft delete 되어있다
      console.error(`User not found for account ${accountId}`)
      throw new UserNotFoundError(`User not found`)
    }
    return {
      id: accountUser.user.id,
      serviceUserId: accountUser.user.serviceUser.id,
      nickname: accountUser.user.nickname,
      name: accountUser.user.name,
      phone: accountUser.user.phone,
      email: accountUser.user.email,
      gender: accountUser.user.gender,
      birthDate: accountUser.user.birthDate,
      birthYear: accountUser.user.birthYear,
      college: accountUser.user.serviceUser.college,
      major: accountUser.user.serviceUser.major,
      admissionClass: accountUser.user.serviceUser.admissionClass,
      grade: accountUser.user.serviceUser.grade,
    }
  }

  public async updateUserRole(userId: string, role: UserRole): Promise<void> {
    const user = await this.userRepository.findOneBy({ id: userId })
    if (!user) {
      throw new UserNotFoundError(`User not found`)
    }
    await this.userRepository.update(userId, { role })
  }

  public async assertAdminRole(accountId: string): Promise<void> {
    const accountUser = await this.accountUserRepository.findOne({
      where: { accountId },
      relations: ['user'],
    })
    if (accountUser?.user?.role !== UserRole.ADMIN) {
      throw new ForbiddenError('admin role required')
    }
  }

  public updateDevice(
    userId: string,
    pushId: string,
    device: { appVersion?: string; info?: object },
  ) {
    const deviceEntity = this.deviceRepository.create({
      userId,
      pushId,
      appVersion: device.appVersion,
      deviceInfo: device.info ? JSON.stringify(device.info) : undefined,
    })
    return this.deviceRepository.upsert(deviceEntity, {
      conflictPaths: ['userId', 'pushId'],
      skipUpdateIfNoValuesChanged: true,
    })
  }

  async updateProfile(user: User, updateProfileDto: UpdateProfileDto) {
    await this.userRepository.update(user.id, {
      nickname: updateProfileDto.nickname,
      name: updateProfileDto.name,
      email: updateProfileDto.email,
      gender: updateProfileDto.gender,
      birthDate: updateProfileDto.birthDate,
      birthYear: updateProfileDto.birthYear,
    })
    let college = updateProfileDto.college
    let major = updateProfileDto.major
    if (updateProfileDto.collegeMajorId) {
      const collegeMajor = await this.collegeMajorRepository.findOneByOrFail({
        id: updateProfileDto.collegeMajorId,
      })
      if (collegeMajor) {
        college = collegeMajor.college ?? ''
        major = collegeMajor.major ?? ''
      }
    }
    await this.serviceUserRepository.update(user.serviceUserId, {
      college: college,
      major: major,
      collegeMajorId: updateProfileDto.collegeMajorId,
      admissionClass: updateProfileDto.admissionClass,
      grade: updateProfileDto.grade,
    })
  }

  async throwUserVoice(serviceUserId: string, content: string) {
    await this.userVoiceRepository.insert({
      serviceUserId,
      content,
    })
  }

  async markLogin(userId: string, token: string | null) {
    const accountUser = await this.accountUserRepository.findOneBy({
      userId,
    })
    if (!accountUser) {
      return
    }
    await this.accountRepository.update(accountUser.accountId, {
      lastLoginAt: new Date().toISOString(),
      authToken: token,
    })
  }

  async logVisitAppDownloadPage(userDevice: string, userIp = '', params = '') {
    await this.userActivityLogRepository.insert({
      type: UserActivityLogType.OPEN_APP_DOWNLOAD_PAGE,
      userDevice,
      params,
      userIp,
    })
  }

  async getCollegeMajors(options: { includeNullMajor?: boolean } = {}): Promise<CollegeMajor[]> {
    const { includeNullMajor = false } = options
    const entities = await this.collegeMajorRepository.find({
      where: includeNullMajor
        ? undefined
        : {
            major: Not(IsNull()),
          },
      order: {
        college: 'ASC',
        id: 'ASC',
      },
    })
    return entities.map((entity) => ({
      id: entity.id,
      college: entity.college,
      major: entity.major,
    }))
  }

  async serviceUserShouldExist(serviceUserId: string) {
    const resource = await this.serviceUserRepository.findOneBy({
      id: serviceUserId,
    })
    if (!resource) {
      throw new UserNotFoundError(`User not found`)
    }
  }

  async findRecentSearches(
    serviceUserId: string,
    limit: number = RECENT_SEARCH_LIMIT,
  ): Promise<UserRecentSearchEntity[]> {
    return this.userRecentSearchRepository.find({
      where: { serviceUserId },
      order: { updatedAt: 'DESC' },
      take: limit,
    })
  }

  async saveRecentSearch(
    serviceUserId: string,
    query: string,
    limit: number = RECENT_SEARCH_LIMIT,
  ): Promise<void> {
    const normalizedQuery = query.trim()
    const manager = this.userRecentSearchRepository.manager

    await manager.query(
      `INSERT INTO user_recent_search (service_user_id, query)
       VALUES ($1, $2)
       ON CONFLICT (service_user_id, query)
       DO UPDATE SET updated_at = CURRENT_TIMESTAMP(6)`,
      [serviceUserId, normalizedQuery],
    )

    await manager.query(
      `DELETE FROM user_recent_search
       WHERE service_user_id = $1
         AND id NOT IN (
           SELECT id FROM user_recent_search
           WHERE service_user_id = $1
           ORDER BY updated_at DESC
           LIMIT $2
         )`,
      [serviceUserId, limit],
    )
  }

  async deleteRecentSearches(serviceUserId: string): Promise<void> {
    await this.userRecentSearchRepository.delete({ serviceUserId })
  }
}
