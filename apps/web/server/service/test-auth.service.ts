import { Repository } from 'typeorm'
import jwt from 'jsonwebtoken'
import { ENV } from 'server/ENV'
import {
  AccountEntity,
  AccountType,
  AccountUserEntity,
  SERVICE,
  ServiceUserEntity,
  UserEntity,
} from 'server/infra/database/entities'
import { UserRole } from 'server/infra/database/entities/user-role.enum'
import { InjectRepository, Service } from 'server/provider'

const TEST_ACCOUNT_USERNAME_PREFIX = 'test:'

export type TestLoginInput = {
  username: string
  nickname?: string
  name?: string
  email?: string
}

export type TestLoginResult = {
  token: string
  accountId: string
  userId: string
  serviceUserId: string
  username: string
}

@Service
export class TestAuthService {
  @InjectRepository(AccountEntity)
  private readonly accountRepository: Repository<AccountEntity>
  @InjectRepository(UserEntity)
  private readonly userRepository: Repository<UserEntity>
  @InjectRepository(AccountUserEntity)
  private readonly accountUserRepository: Repository<AccountUserEntity>
  @InjectRepository(ServiceUserEntity)
  private readonly serviceUserRepository: Repository<ServiceUserEntity>

  async login(input: TestLoginInput): Promise<TestLoginResult> {
    const username = `${TEST_ACCOUNT_USERNAME_PREFIX}${input.username}`
    const account = await this.findOrCreateAccount(username, input)
    const { user, serviceUser } = await this.findOrCreateUser(account.id, input)
    const token = jwt.sign({ sub: account.id }, ENV.JWT.SECRET_KEY, {
      algorithm: 'HS256',
      expiresIn: '1y',
    })

    await this.accountRepository.update(account.id, {
      lastLoginAt: new Date().toISOString(),
      authToken: token,
    })

    return {
      token,
      accountId: account.id,
      userId: user.id,
      serviceUserId: serviceUser.id,
      username,
    }
  }

  private async findOrCreateAccount(
    username: string,
    input: TestLoginInput,
  ): Promise<AccountEntity> {
    const account = await this.accountRepository.findOne({
      where: {
        type: AccountType.KAKAO,
        username,
      },
      order: {
        createdAt: 'ASC',
      },
    })
    if (account) {
      return account
    }

    return this.accountRepository.save({
      type: AccountType.KAKAO,
      username,
      password: '',
      socialInfo: {
        provider: 'test',
        username: input.username,
      },
    })
  }

  private async findOrCreateUser(
    accountId: string,
    input: TestLoginInput,
  ): Promise<{ user: UserEntity; serviceUser: ServiceUserEntity }> {
    const accountUser = await this.accountUserRepository.findOne({
      where: {
        accountId,
      },
      relations: ['user'],
    })
    if (accountUser?.user) {
      const serviceUser =
        accountUser.user.serviceUser ??
        (await this.serviceUserRepository.findOneBy({
          userId: accountUser.user.id,
        })) ??
        (await this.serviceUserRepository.save({
          userId: accountUser.user.id,
        }))
      return {
        user: accountUser.user,
        serviceUser,
      }
    }

    const user = await this.userRepository.save({
      service: SERVICE,
      nickname: input.nickname ?? input.username,
      name: input.name ?? input.nickname ?? input.username,
      email: input.email ?? `${input.username}@test.all-clear.local`,
      role: UserRole.USER,
    })
    await this.accountUserRepository.insert({ accountId, userId: user.id })
    const serviceUser = await this.serviceUserRepository.save({
      userId: user.id,
    })

    return {
      user,
      serviceUser,
    }
  }
}
