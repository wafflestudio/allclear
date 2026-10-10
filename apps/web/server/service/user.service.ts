import { UserRole } from 'server/domain/constants/user-role.enum'
import type { UpdateProfileDto } from '../../server/http/schemas/users'
import { ForbiddenError, UserNotFoundError } from '../domain/error'
import type { CollegeMajor } from '../domain/model/CollegeMajor'
import type { User } from '../domain/model/User'
import { UserActivityLogType } from '../infra/database/entities'
import { getPrismaClient } from '../infra/database/prisma'
import { toTimestampString } from '../infra/database/prisma-mapping'
import { Service } from '../provider'

const RECENT_SEARCH_LIMIT = 8

type UserRecentSearch = {
  query: string
  updatedAt: string
}

@Service
export class UserService {
  public async getUserByAccountId(accountId: string): Promise<User> {
    if (!accountId) {
      throw new UserNotFoundError('User not found')
    }

    const prisma = getPrismaClient()
    const account = await prisma.account.findFirst({
      where: { id: accountId, deleted_at: null },
    })
    if (!account) {
      throw new UserNotFoundError('Account not found')
    }

    const accountUser = await prisma.account_user.findFirst({
      where: { account_id: accountId },
    })
    if (!accountUser) {
      throw new UserNotFoundError('AccountUser not found')
    }

    const [user, serviceUser] = await Promise.all([
      prisma.user.findFirst({ where: { id: accountUser.user_id, deleted_at: null } }),
      prisma.allclear_user.findFirst({
        where: { user_id: accountUser.user_id, deleted_at: null },
      }),
    ])
    if (!user || !serviceUser) {
      // 탈퇴 후 계정과 연결 정보가 남아 있어도 활성 사용자로 취급하지 않는다.
      console.error(`User not found for account ${accountId}`)
      throw new UserNotFoundError('User not found')
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
        ? { id: collegeMajor.id, college: collegeMajor.college, major: collegeMajor.major }
        : null,
      admissionClass: serviceUser.admission_class,
    }
  }

  public async updateUserRole(userId: string, role: UserRole): Promise<void> {
    const prisma = getPrismaClient()
    const user = await prisma.user.findFirst({ where: { id: userId, deleted_at: null } })
    if (!user) {
      throw new UserNotFoundError('User not found')
    }
    await prisma.user.updateMany({
      where: { id: userId, deleted_at: null },
      data: { role, updated_at: new Date() },
    })
  }

  public async assertAdminRole(accountId: string): Promise<void> {
    const prisma = getPrismaClient()
    const accountUser = await prisma.account_user.findFirst({
      where: { account_id: accountId },
    })
    const user = accountUser
      ? await prisma.user.findFirst({
          where: { id: accountUser.user_id, deleted_at: null },
        })
      : null
    if (user?.role !== UserRole.ADMIN) {
      throw new ForbiddenError('admin role required')
    }
  }

  async updateProfile(user: User, updateProfileDto: UpdateProfileDto): Promise<void> {
    const prisma = getPrismaClient()
    const now = new Date()
    await prisma.$transaction([
      prisma.user.updateMany({
        where: { id: user.id },
        data: {
          nickname: updateProfileDto.nickname,
          name: updateProfileDto.name,
          email: updateProfileDto.email,
          updated_at: now,
        },
      }),
      prisma.allclear_user.updateMany({
        where: { id: user.serviceUserId },
        data: {
          college_major_id: updateProfileDto.collegeMajorId,
          admission_class: updateProfileDto.admissionClass,
          updated_at: now,
        },
      }),
    ])
  }

  async throwUserVoice(serviceUserId: string, content: string): Promise<void> {
    await getPrismaClient().user_voice.create({
      data: { service_user_id: serviceUserId, content },
    })
  }

  async markLogin(userId: string, token: string | null): Promise<void> {
    const prisma = getPrismaClient()
    const accountUser = await prisma.account_user.findFirst({ where: { user_id: userId } })
    if (!accountUser) {
      return
    }
    const now = new Date()
    await prisma.account.updateMany({
      where: { id: accountUser.account_id },
      data: { last_login_at: now, auth_token: token, updated_at: now },
    })
  }

  async logVisitAppDownloadPage(userDevice: string, userIp = '', params = ''): Promise<void> {
    await getPrismaClient().user_activity_log.create({
      data: {
        type: UserActivityLogType.OPEN_APP_DOWNLOAD_PAGE,
        user_device: userDevice,
        user_ip: userIp,
        params,
      },
    })
  }

  async getCollegeMajors(options: { includeNullMajor?: boolean } = {}): Promise<CollegeMajor[]> {
    const { includeNullMajor = false } = options
    const entities = await getPrismaClient().college_major.findMany({
      where: {
        deleted_at: null,
        ...(includeNullMajor ? {} : { major: { not: null } }),
      },
      orderBy: [{ college: 'asc' }, { id: 'asc' }],
    })
    return entities.map((entity) => ({
      id: entity.id,
      college: entity.college,
      major: entity.major,
    }))
  }

  async serviceUserShouldExist(serviceUserId: string): Promise<void> {
    const resource = await getPrismaClient().allclear_user.findFirst({
      where: { id: serviceUserId, deleted_at: null },
    })
    if (!resource) {
      throw new UserNotFoundError('User not found')
    }
  }

  async findRecentSearches(
    serviceUserId: string,
    limit: number = RECENT_SEARCH_LIMIT,
  ): Promise<UserRecentSearch[]> {
    const searches = await getPrismaClient().user_recent_search.findMany({
      where: { service_user_id: serviceUserId },
      orderBy: { updated_at: 'desc' },
      take: limit,
    })
    return searches.map((search) => ({
      query: search.query,
      updatedAt: toTimestampString(search.updated_at),
    }))
  }

  async saveRecentSearch(
    serviceUserId: string,
    query: string,
    limit: number = RECENT_SEARCH_LIMIT,
  ): Promise<void> {
    const normalizedQuery = query.trim()
    await getPrismaClient().$transaction(async (tx) => {
      await tx.user_recent_search.upsert({
        where: {
          service_user_id_query: { service_user_id: serviceUserId, query: normalizedQuery },
        },
        create: { service_user_id: serviceUserId, query: normalizedQuery },
        update: { updated_at: new Date() },
      })

      const obsoleteSearches = await tx.user_recent_search.findMany({
        where: { service_user_id: serviceUserId },
        orderBy: { updated_at: 'desc' },
        skip: limit,
        select: { id: true },
      })
      if (obsoleteSearches.length > 0) {
        await tx.user_recent_search.deleteMany({
          where: { id: { in: obsoleteSearches.map((search) => search.id) } },
        })
      }
    })
  }

  async deleteRecentSearches(serviceUserId: string): Promise<void> {
    await getPrismaClient().user_recent_search.deleteMany({
      where: { service_user_id: serviceUserId },
    })
  }
}
