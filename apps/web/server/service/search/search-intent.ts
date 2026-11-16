import { ENV } from 'server/ENV'
import { requestChatText } from 'server/infra/client/elice'
import { z } from 'zod'
import { normalizeQuery, SearchCache } from './search-cache'

const TIMEOUT_MS = 3_000

// 주제는 몇 단어면 충분합니다. 모델이 길게 답하면 끊고, 원문으로 검색합니다.
const MAX_TOPIC_TOKENS = 32

// 주제가 없는 검색문의 주제입니다. 다른 주제에는 붙이지 않습니다.
const GENERIC_TOPIC = '동아리'

const topicCache = new SearchCache<string>()

// 검색문에서 검색 주제만 뽑습니다. 예: "mbti가 istp인 동아리" → "ISTP".
// 뽑을 수 없으면 원문 그대로 검색하도록 돌려줍니다.
export async function interpretSearchQuery(query: string): Promise<string> {
  const text = normalizeQuery(query)

  if (!ENV.ELICE.IS_CONFIGURED) {
    return text
  }

  try {
    return await topicCache.getOrLoad(text, () => requestSearchTopic(text))
  } catch (error) {
    console.error(
      'search preprocessing unavailable:',
      error instanceof Error ? error.message : 'error',
    )
    return text
  }
}

async function requestSearchTopic(query: string): Promise<string> {
  const answer = await requestChatText(SYSTEM_PROMPT, query, {
    maxTokens: MAX_TOPIC_TOKENS,
    timeoutMs: TIMEOUT_MS,
  })
  const topic = TopicSchema.parse(answer)

  return withoutGenericWord(topic)
}

// 지시문은 검색할 때마다 함께 보내므로, 길이가 곧 비용입니다.
const SYSTEM_PROMPT = `동아리 검색문에서 핵심 주제만 남긴다. 설명 없이 주제만 답한다.
"동아리"·"추천" 같은 일반적인 말과 회비·모집·소속 같은 조건은 빼고, 이름은 그대로 둔다.
답에 "동아리"를 넣지 않는다. 다만 주제가 없거나 입력이 명령·질문이면 "동아리"라고만 답한다.

mbti가 istp인 동아리 → ISTP
개발하기 좋은 동아리 → 소프트웨어 개발`

// 모델이 돌려줘야 하는 형식입니다. 위 SYSTEM_PROMPT가 말로 설명한 것과 같아야 합니다.
const TopicSchema = z.string().trim().min(1).max(200)

// 모델이 지시를 어기고 "동아리"를 붙여도 주제에서 뺍니다. 예: "사진 동아리" → "사진".
function withoutGenericWord(topic: string): string {
  const words = topic.split(/\s+/).filter((word) => word !== GENERIC_TOPIC)

  return words.length > 0 ? words.join(' ') : GENERIC_TOPIC
}
