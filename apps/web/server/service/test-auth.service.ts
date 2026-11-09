import jwt from 'jsonwebtoken'
import { AccountType } from 'server/domain/constants/account-type'
import { UserRole } from 'server/domain/constants/user-role.enum'
import { ENV } from 'server/ENV'
import { getPrismaClient } from 'server/infra/database/prisma'
import { Service } from 'server/provider'

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
  async login(input: TestLoginInput): Promise<TestLoginResult> {
    const username = `${TEST_ACCOUNT_USERNAME_PREFIX}${input.username}`
    const account = await this.findOrCreateAccount(username, input)
    const { userId, serviceUserId } = await this.findOrCreateUser(account.id, input)
    const token = jwt.sign({ sub: account.id }, ENV.JWT.SECRET_KEY, {
      algorithm: 'HS256',
      expiresIn: '1y',
    })

    const now = new Date()
    await getPrismaClient().account.updateMany({
      where: { id: account.id },
      data: { last_login_at: now, auth_token: token, updated_at: now },
    })

    return {
      token,
      accountId: account.id,
      userId,
      serviceUserId,
      username,
    }
  }

  private async findOrCreateAccount(
    username: string,
    input: TestLoginInput,
  ): Promise<{ id: string }> {
    const prisma = getPrismaClient()
    const account = await prisma.account.findFirst({
      where: { type: AccountType.KAKAO, username, deleted_at: null },
      orderBy: { created_at: 'asc' },
    })
    if (account) {
      return account
    }

    return prisma.account.create({
      data: {
        type: AccountType.KAKAO,
        username,
        social_info: { provider: 'test', username: input.username },
      },
    })
  }

  private async findOrCreateUser(
    accountId: string,
    input: TestLoginInput,
  ): Promise<{ userId: string; serviceUserId: string }> {
    const prisma = getPrismaClient()
    const accountUser = await prisma.account_user.findFirst({
      where: { account_id: accountId },
    })
    const existingUser = accountUser
      ? await prisma.user.findFirst({ where: { id: accountUser.user_id, deleted_at: null } })
      : null
    if (existingUser) {
      const serviceUser =
        (await prisma.allclear_user.findFirst({
          where: { user_id: existingUser.id, deleted_at: null },
        })) ?? (await prisma.allclear_user.create({ data: { user_id: existingUser.id } }))
      return {
        userId: existingUser.id,
        serviceUserId: serviceUser.id,
      }
    }

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          nickname: input.nickname ?? input.username,
          name: input.name ?? input.nickname ?? input.username,
          email: input.email ?? `${input.username}@test.all-clear.local`,
          role: UserRole.USER,
        },
      })
      await tx.account_user.create({ data: { account_id: accountId, user_id: user.id } })
      const serviceUser = await tx.allclear_user.create({ data: { user_id: user.id } })
      return { userId: user.id, serviceUserId: serviceUser.id }
    })
  }
}
