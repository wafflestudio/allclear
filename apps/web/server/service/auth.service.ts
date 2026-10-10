import axios from 'axios'
import * as qs from 'qs'
import { UserRole } from 'server/domain/constants/user-role.enum'
import { UserNotFoundError } from '../domain/error'
import type { User } from '../domain/model/User'
import { ENV } from '../ENV'
import { AccountType } from '../infra/database/entities/account-type.enum'
import type { Prisma } from '../infra/database/generated/prisma/client'
import { getPrismaClient } from '../infra/database/prisma'
import { Service } from '../provider'
import { getSafeErrorName } from '../util/safe-error'

type AccountId = string

@Service
export class AuthService {
  async getUserByOauthId(type: AccountType, oauthId: string): Promise<User> {
    const prisma = getPrismaClient()
    const account = await prisma.account.findFirst({
      where: { type, username: oauthId, deleted_at: null },
    })
    if (!account) {
      throw new UserNotFoundError(`Account not found`)
    }
    const accountUser = await prisma.account_user.findFirst({
      where: { account_id: account.id },
    })
    if (!accountUser) {
      throw new UserNotFoundError(`AccountUser not found`)
    }
    const [user, serviceUser] = await Promise.all([
      prisma.user.findFirst({ where: { id: accountUser.user_id, deleted_at: null } }),
      prisma.allclear_user.findFirst({
        where: { user_id: accountUser.user_id, deleted_at: null },
      }),
    ])
    if (!user || !serviceUser) {
      // 유저가 회원탈퇴를 한 경우 account는 남아있고 해당 서비스의 user만 soft delete 되어있다
      console.error('active service user not found for account', { accountType: type })
      throw new UserNotFoundError(`User not found`)
    }
    const collegeMajor =
      serviceUser.college_major_id == null
        ? null
        : await prisma.college_major.findFirst({
            where: { id: serviceUser.college_major_id, deleted_at: null },
          })
    return {
      id: user.id,
      serviceUserId: serviceUser.id,
      nickname: user.nickname,
      name: user.name,
      phone: user.phone,
      email: user.email,
      collegeMajor: collegeMajor
        ? {
            id: collegeMajor.id,
            college: collegeMajor.college,
            major: collegeMajor.major,
          }
        : null,
      admissionClass: serviceUser.admission_class,
    }
  }

  async createUserByOauth({
    type,
    username,
    nickname,
    name,
    phone,
    email,
    socialAccountInfo,
  }: {
    type: AccountType
    username: string
    nickname?: string
    name?: string
    phone?: string
    email?: string
    socialAccountInfo: object
  }): Promise<AccountId> {
    return getPrismaClient().$transaction(async (tx) => {
      const account = await tx.account.create({
        data: {
          type,
          username,
          social_info: socialAccountInfo as Prisma.InputJsonValue,
        },
      })
      const user = await tx.user.create({
        data: {
          nickname: nickname ?? '',
          name: name ?? '',
          phone: phone ?? '',
          email: email ?? '',
          role: UserRole.USER,
        },
      })
      await tx.account_user.create({
        data: { account_id: account.id, user_id: user.id },
      })
      await tx.allclear_user.create({ data: { user_id: user.id } })
      return account.id
    })
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
    const account = await this.findOrRestoreAccount(AccountType.APPLE, accountId)
    if (account) {
      return account.id
    }

    let parsedUser: Record<string, any> = {}
    try {
      parsedUser = JSON.parse(user || '{}')
    } catch (err) {
      console.error('Failed to parse Apple user payload', {
        errorName: getSafeErrorName(err),
      })
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

  async findOrRestoreAccount(type: AccountType, username: string): Promise<{ id: string } | null> {
    const prisma = getPrismaClient()
    const account = await prisma.account.findFirst({
      where: { type, username, deleted_at: null },
    })
    if (!account) {
      return null
    }
    const accountUser = await prisma.account_user.findFirst({
      where: { account_id: account.id },
    })
    if (!accountUser) {
      return null
    }
    const user = await prisma.user.findUnique({
      where: { id: accountUser.user_id },
      select: { id: true, deleted_at: true },
    })
    if (!user) {
      throw new Error(`User not found for account ${account.id}`)
    }
    if (user.deleted_at) {
      const now = new Date()
      await prisma.$transaction([
        prisma.user.updateMany({
          where: { id: user.id },
          data: { deleted_at: null, updated_at: now },
        }),
        prisma.allclear_user.updateMany({
          where: { user_id: user.id },
          data: { deleted_at: null, updated_at: now },
        }),
      ])
    }
    return { id: account.id }
  }

  async leaveUser(userId: string): Promise<void> {
    const prisma = getPrismaClient()
    const now = new Date()
    await prisma.$transaction([
      prisma.user.updateMany({
        where: { id: userId },
        data: { deleted_at: now, updated_at: now },
      }),
      prisma.allclear_user.updateMany({
        where: { user_id: userId },
        data: { deleted_at: now, updated_at: now },
      }),
    ])
  }
}
