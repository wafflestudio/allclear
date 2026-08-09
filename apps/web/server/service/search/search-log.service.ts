import { UserActivityLogEntity, UserActivityLogType } from 'server/infra/database/entities'
import { InjectRepository, Service } from 'server/provider'
import type { Repository } from 'typeorm'

@Service
export class SearchLogService {
  @InjectRepository(UserActivityLogEntity)
  private readonly userActivityLogRepository: Repository<UserActivityLogEntity>

  logSearch(query: string): void {
    this.userActivityLogRepository
      .insert({
        type: UserActivityLogType.CALL_SEARCH_CLUBS_API,
        params: JSON.stringify({ query }),
      })
      .catch(console.error)
  }
}
