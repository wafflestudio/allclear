import { Repository } from 'typeorm'
import { InjectRepository, Service } from 'server/provider'
import {
  AccountEntity,
  AccountUserEntity,
  DeviceEntity,
  ServiceUserEntity,
  UserActivityLogEntity,
  UserActivityLogType,
  UserEntity,
  UserVoiceEntity,
} from 'server/infra/database/entities'
import { User } from 'server/domain/model/User'
import { UserNotFoundError } from 'server/domain/error'
import { UpdateProfileDto } from 'pages/api/v1/users/me'
import { CollegeMajorEntity } from 'server/infra/database/entities/college-major.entity'

export type V1CollegeMajor = {
  id: number
  college: string
  major: string
}

@Service
export class UserServiceV1 {
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

  @InjectRepository(DeviceEntity)
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
        college = collegeMajor.college ?? undefined
        major = collegeMajor.major ?? undefined
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

  async getCollegeMajors(): Promise<V1CollegeMajor[]> {
    const entities = await this.collegeMajorRepository.find({
      order: {
        college: 'ASC',
        id: 'ASC',
      },
    })
    return entities.map((entity) => ({
      id: entity.id,
      college: entity.college ?? '',
      major: entity.major ?? '',
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
}
