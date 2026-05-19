import { Repository } from 'typeorm'
import { InjectRepository, Service } from 'server/provider'
import { UserActivityLogEntity, UserActivityLogType } from 'server/infra/database/entities'

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
