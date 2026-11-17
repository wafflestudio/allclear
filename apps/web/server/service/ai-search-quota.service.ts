import { AI_SEARCH_DAILY_LIMIT } from 'server/domain/constants/ai-search'
import { TooManyRequestsError } from 'server/domain/error'
import { getPrismaClient } from 'server/infra/database/prisma'
import { Service } from 'server/provider'

const DAY_MS = 24 * 60 * 60 * 1000
const KST_OFFSET_MS = 9 * 60 * 60 * 1000

@Service
export class AiSearchQuotaService {
  // 오늘 사용량을 1 올립니다. 한도를 넘으면 TooManyRequestsError를 던집니다.
  async consume(accountId: string): Promise<void> {
    const now = Date.now()
    const today = kstDate(now)

    const count = await this.increment(accountId, today)

    // 계정의 오늘 첫 요청에서만 지난 날짜의 row를 지웁니다.
    if (count === 1) {
      this.deleteBefore(today)
    }

    if (count > AI_SEARCH_DAILY_LIMIT) {
      throw new TooManyRequestsError('daily ai search limit exceeded', secondsUntilKstMidnight(now))
    }
  }

  // 조회와 증가를 한 문장으로 묶어, 동시 요청이 한도를 넘지 못하게 합니다.
  private async increment(accountId: string, today: string): Promise<number> {
    const [usage] = await getPrismaClient().$queryRaw<Array<{ count: number }>>`
      INSERT INTO public.ai_search_usage (usage_date, account_id)
      VALUES (${today}::date, ${accountId}::uuid)
      ON CONFLICT (usage_date, account_id)
      DO UPDATE SET count = ai_search_usage.count + 1
      RETURNING count
    `
    return usage.count
  }

  // 응답을 늦추지 않도록 기다리지 않습니다.
  private deleteBefore(today: string): void {
    const deletion = getPrismaClient().$executeRaw`
      DELETE FROM public.ai_search_usage
      WHERE usage_date < ${today}::date
    `
    deletion.catch(console.error)
  }
}

// KST는 UTC+9로 고정입니다. 9시간 민 시각을 UTC로 읽으면 KST 날짜가 됩니다.
function kstDate(now: number): string {
  return new Date(now + KST_OFFSET_MS).toISOString().slice(0, 10)
}

function secondsUntilKstMidnight(now: number): number {
  const elapsedToday = (now + KST_OFFSET_MS) % DAY_MS
  return Math.ceil((DAY_MS - elapsedToday) / 1000)
}
