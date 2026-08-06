import { Repository } from 'typeorm'
import axios from 'axios'
import * as qs from 'qs'
import { InjectRepository, Service } from '../provider'
import {
  AccountEntity,
  AccountType,
  AccountUserEntity,
  SERVICE,
  ServiceUserEntity,
  UserEntity,
} from '../infra/database/entities'
import { User } from '../domain/model/User'
import { UserRole } from '../infra/database/entities/user-role.enum'
import { ENV } from '../ENV'
import { UserNotFoundError } from '../domain/error'

type AccountId = string

@Service
export class AuthService {
  @InjectRepository(AccountEntity)
  private readonly accountRepository: Repository<AccountEntity>
  @InjectRepository(UserEntity)
  private readonly userRepository: Repository<UserEntity>
  @InjectRepository(AccountUserEntity)
  private readonly accountUserRepository: Repository<AccountUserEntity>
  @InjectRepository(ServiceUserEntity)
  private readonly serviceUserRepository: Repository<ServiceUserEntity>

  async getUserByOauthId(type: AccountType, oauthId: string): Promise<User> {
    const account = await this.accountRepository.findOneBy({
      type,
      username: oauthId,
    })
    if (!account) {
      throw new UserNotFoundError(`Account not found`)
    }
    const accountUser = await this.accountUserRepository.findOne({
      where: {
        accountId: account.id,
      },
      relations: ['user'],
    })
    if (!accountUser) {
      throw new UserNotFoundError(`AccountUser not found`)
    }
    if (!accountUser.user?.serviceUser) {
      // 유저가 회원탈퇴를 한 경우 account는 남아있고 해당 서비스의 user만 soft delete 되어있다
      console.error(`User not found for account ${account.id}`)
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

  async createUserByOauth({
    type,
    username,
    nickname,
    name,
    phone,
    email,
    gender,
    birthDate,
    birthYear,
    socialAccountInfo,
  }: {
    type: AccountType
    username: string
    nickname?: string
    name?: string
    phone?: string
    email?: string
    gender?: string
    birthDate?: string
    birthYear?: string
    socialAccountInfo: object
  }): Promise<AccountId> {
    const account = await this.accountRepository.save({
      type,
      username,
      password: '',
      socialInfo: socialAccountInfo,
    })
    const user = await this.userRepository.save({
      service: SERVICE,
      nickname: nickname,
      name: name,
      phone: phone,
      email: email,
      role: UserRole.USER,
      gender: gender,
      birthDate: birthDate,
      birthYear: birthYear,
    })
    await this.accountUserRepository.insert({ accountId: account.id, userId: user.id })
    await this.serviceUserRepository.insert({ userId: user.id })
    return account.id
  }

  public async getKakaoAccessToken(authcode: string): Promise<string> {
    const tokenResponse = await axios({
      method: 'POST',
      url: 'https://kauth.kakao.com/oauth/token',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      data: qs.stringify({
        grant_type: 'authorization_code',
        code: authcode,
        client_id: ENV.KAKAO.CLIENT_ID,
        client_secret: ENV.KAKAO.CLIENT_SECRET,
        redirect_uri: ENV.KAKAO.REDIRECT_URI,
      }),
    })
    return tokenResponse.data.access_token
  }

  public async getOrCreateKakaoUser(accessToken: string) {
    const userResponse = await axios({
      method: 'get',
      url: 'https://kapi.kakao.com/v2/user/me',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    const user = userResponse.data
    console.log('[kakao user profile] ', user)

    const account = await this.findOrRestoreAccount(AccountType.KAKAO, user.id)
    if (account) {
      return account.id
    }

    const kakaoAccount = user.kakao_account
    return this.createUserByOauth({
      type: AccountType.KAKAO,
      username: user.id,
      nickname: kakaoAccount?.profile?.nickname || user.properties?.nickname,
      name: kakaoAccount?.name,
      email: kakaoAccount.email,
      phone: kakaoAccount?.phone_number?.startsWith('+82 10')
        ? `010${kakaoAccount?.phone_number.slice('+82 10'.length)}`
        : kakaoAccount?.phone_number,
      birthDate:
        kakaoAccount.birthyear &&
        kakaoAccount.birthday &&
        `${kakaoAccount.birthyear}-${kakaoAccount.birthday.slice(
          0,
          2,
        )}-${kakaoAccount.birthday.slice(2, 4)}`,
      gender:
        kakaoAccount.gender === 'female'
          ? '여자'
          : kakaoAccount.gender === 'male'
          ? '남자'
          : kakaoAccount.gender,
      socialAccountInfo: user,
    })
  }

  async createAppleUser({
    accountId = '',
    email = '',
    user = '{}',
  }: {
    accountId?: string
    email?: string
    user?: string
  }) {
    console.info(`Apple Account ID: ${accountId}`)
    console.info(`Apple Email: ${email}`)

    const account = await this.findOrRestoreAccount(AccountType.APPLE, accountId)
    if (account) {
      return account.id
    }

    let parsedUser: Record<string, any> = {}
    try {
      parsedUser = JSON.parse(user || '{}')
    } catch (err) {
      console.error('Failed to parse Apple user payload', err)
    }

    // Names are only shown in the first time.
    const firstName = parsedUser.name?.firstName ?? ''
    const lastName = parsedUser.name?.lastName ?? ''

    return this.createUserByOauth({
      type: AccountType.APPLE,
      username: accountId,
      nickname: (lastName + firstName).trim() || email.split('@')[0],
      name: (lastName + firstName).trim(),
      email: email,
      socialAccountInfo: parsedUser,
    })
  }

  async findOrRestoreAccount(type: AccountType, username: string): Promise<AccountEntity | null> {
    const account = await this.accountRepository.findOneBy({
      type,
      username,
    })
    if (!account) {
      return null
    }
    const accountUser = await this.accountUserRepository.findOneBy({
      accountId: account.id,
    })
    if (!accountUser) {
      return null
    }
    const user = await this.userRepository.findOne({
      select: ['id', 'deletedAt'],
      where: {
        id: accountUser.userId,
      },
      withDeleted: true,
    })
    if (!user) {
      throw new Error(`User not found for account ${account.id}`)
    }
    if (user.deletedAt) {
      await this.userRepository.restore(user.id)
      await this.serviceUserRepository.restore({
        userId: user.id,
      })
    }
    return account
  }

  async leaveUser(userId: string) {
    await this.userRepository.softRemove({
      id: userId,
    })
    await this.serviceUserRepository.softDelete({
      userId: userId,
    })
  }
}
