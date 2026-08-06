import { Repository } from 'typeorm'
import { AppVersionPolicyEntity, type AppClientType } from 'server/infra/database/entities'
import { getRedisClient } from 'server/infra/redis/client'
import { BadRequestError, NotFoundError } from 'server/domain/error'
import { InjectRepository, Service } from 'server/provider'

const APP_VERSION_POLICY_CACHE_TTL_SECONDS = 24 * 60 * 60
const STORE_URLS: Record<AppClientType, string> = {
  android: 'https://play.google.com/store/apps/details?id=com.padocorp.clubhouse.applicationId',
  ios: 'https://apps.apple.com/kr/app/%ED%81%B4%EB%9F%BD%ED%95%98%EC%9A%B0%EC%8A%A4-%EC%9A%B0%EB%A6%AC-%ED%95%99%EA%B5%90-%EB%AA%A8%EB%93%A0-%EB%8F%99%EC%95%84%EB%A6%AC/id6461214029',
}

type AppVersionPolicy = {
  clientType: AppClientType
  minSupportedVersion: string
}

type AppVersionPolicyUpdate = {
  clientType: AppClientType
  minSupportedVersion: string
}

type AppVersionCheckResult = AppVersionPolicy & {
  updateRequired: boolean
  storeUrl: string
}

const appVersionPolicyCacheKey = (clientType: AppClientType) =>
  `app-version-policy:${clientType}`

function parseVersion(version: string): number[] {
  return version.split('.').map((part) => Number(part))
}

function compareVersions(left: string, right: string): number {
  const leftParts = parseVersion(left)
  const rightParts = parseVersion(right)
  const length = Math.max(leftParts.length, rightParts.length)

  for (let index = 0; index < length; index += 1) {
    const leftValue = leftParts[index] ?? 0
    const rightValue = rightParts[index] ?? 0
    if (leftValue !== rightValue) {
      return leftValue > rightValue ? 1 : -1
    }
  }

  return 0
}

@Service
export class AppVersionService {
  @InjectRepository(AppVersionPolicyEntity)
  private readonly appVersionPolicyRepository: Repository<AppVersionPolicyEntity>

  async checkVersion(
    clientType: AppClientType,
    appVersion: string,
  ): Promise<AppVersionCheckResult> {
    const policy = await this.getPolicy(clientType)

    return {
      ...policy,
      updateRequired: compareVersions(appVersion, policy.minSupportedVersion) < 0,
      storeUrl: STORE_URLS[clientType],
    }
  }

  async upsertPolicy(policy: AppVersionPolicyUpdate): Promise<AppVersionPolicy> {
    await this.appVersionPolicyRepository.upsert(policy, {
      conflictPaths: ['clientType'],
      skipUpdateIfNoValuesChanged: true,
    })
    await this.deleteCachedPolicy(policy.clientType)
    const savedPolicy = await this.appVersionPolicyRepository.findOneBy({
      clientType: policy.clientType,
    })
    if (!savedPolicy) {
      throw new BadRequestError('failed to save app version policy')
    }
    return this.toPolicy(savedPolicy)
  }

  private async getPolicy(clientType: AppClientType): Promise<AppVersionPolicy> {
    const cachedPolicy = await this.getCachedPolicy(clientType)
    if (cachedPolicy) {
      return cachedPolicy
    }

    const policy = await this.appVersionPolicyRepository.findOneBy({ clientType })
    if (!policy) {
      throw new NotFoundError('app version policy not found')
    }

    const result = this.toPolicy(policy)
    await this.cachePolicy(result)
    return result
  }

  private toPolicy(policy: AppVersionPolicyEntity): AppVersionPolicy {
    return {
      clientType: policy.clientType,
      minSupportedVersion: policy.minSupportedVersion,
    }
  }

  private async getCachedPolicy(clientType: AppClientType): Promise<AppVersionPolicy | null> {
    try {
      const redis = await getRedisClient()
      if (!redis) {
        return null
      }
      const rawPolicy = (await redis.sendCommand([
        'GET',
        appVersionPolicyCacheKey(clientType),
      ])) as string | null
      return rawPolicy ? (JSON.parse(rawPolicy) as AppVersionPolicy) : null
    } catch (err) {
      console.error('getCachedAppVersionPolicy error: ', err)
      return null
    }
  }

  private async cachePolicy(policy: AppVersionPolicy): Promise<void> {
    try {
      const redis = await getRedisClient()
      if (!redis) {
        return
      }
      await redis.sendCommand([
        'SET',
        appVersionPolicyCacheKey(policy.clientType),
        JSON.stringify(policy),
        'EX',
        String(APP_VERSION_POLICY_CACHE_TTL_SECONDS),
      ])
    } catch (err) {
      console.error('cacheAppVersionPolicy error: ', err)
    }
  }

  private async deleteCachedPolicy(clientType: AppClientType): Promise<void> {
    try {
      const redis = await getRedisClient()
      if (!redis) {
        return
      }
      await redis.sendCommand(['DEL', appVersionPolicyCacheKey(clientType)])
    } catch (err) {
      console.error('deleteCachedAppVersionPolicy error: ', err)
    }
  }
}
