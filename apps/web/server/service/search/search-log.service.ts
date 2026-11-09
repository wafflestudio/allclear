import { UserActivityLogType } from 'server/domain/constants/user-activity-log-type'
import { getPrismaClient } from 'server/infra/database/prisma'
import { Service } from 'server/provider'

@Service
export class SearchLogService {
  logSearch(query: string): void {
    getPrismaClient()
      .user_activity_log.create({
        data: {
          type: UserActivityLogType.CALL_SEARCH_CLUBS_API,
          params: JSON.stringify({ query }),
        },
      })
      .catch(console.error)
  }
}
