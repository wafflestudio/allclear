import { DEFAULT_MIN_SIMILARITY } from 'server/domain/constants/ai-search'
import { PUBLIC_CLUB_STATUS } from 'server/domain/constants/club-status'
import type { ClubDomainSource } from 'server/domain/model/Club'
import { ENV } from 'server/ENV'
import { createEmbeddings, EMBEDDING_VERSION } from 'server/infra/client/elice'
import { Prisma } from 'server/infra/database/generated/prisma/client'
import { getPrismaClient } from 'server/infra/database/prisma'
import { Service } from 'server/provider'
import type { SearchFilters } from './search.types'
import { normalizeQuery, SearchCache } from './search-cache'
import { toClubDomainSources } from './search-club-source'
import { buildSearchFilter } from './search-filter'
import { formsOf, splitWords } from './search-words'

const QUERY_TIMEOUT_MS = 8_000

// 문자열로 찾을 낱말은, 그 낱말이 든 동아리들의 평균 유사도가
// 전체 동아리의 평균보다 표준편차의 1.5배 넘게 높아야 합니다.
const KEYWORD_LIFT = 1.5

// 조사는 두 글자가 남을 때까지 뗍니다. 예: "축구나" → "축구"
const SHORTEST_KEYWORD = 2

const queryVectorCache = new SearchCache<number[]>()

@Service
export class SearchSemanticService {
  // 뜻이 가까운 동아리를 유사도순으로 찾습니다.
  async search(
    query: string,
    filters: SearchFilters = {},
    minSimilarity = DEFAULT_MIN_SIMILARITY,
  ): Promise<ClubDomainSource[]> {
    if (!ENV.ELICE.IS_CONFIGURED) {
      return []
    }

    try {
      const prisma = getPrismaClient()

      // 1. 필터를 통과하고 현재 버전의 임베딩을 가진 동아리가 후보입니다.
      const where: Prisma.clubWhereInput = {
        status: PUBLIC_CLUB_STATUS,
        deleted_at: null,
        embedding_model: EMBEDDING_VERSION,
        ...(await buildSearchFilter(filters)),
      }
      const candidates = await prisma.club.findMany({ where, select: { uuid: true } })
      if (candidates.length === 0) {
        return []
      }

      // 2. 후보를 검색어와 가까운 순서로 줄 세웁니다.
      const candidateIds = candidates.map((club) => club.uuid)
      const queryVector = await embedQuery(query)
      const rankedIds = await this.rankBySimilarity(candidateIds, queryVector, minSimilarity)
      if (rankedIds.length === 0) {
        return []
      }

      // 3. 그 순서대로 동아리를 읽습니다.
      const clubs = await prisma.club.findMany({
        where: { AND: [where, { uuid: { in: rankedIds } }] },
      })
      const clubById = new Map(clubs.map((club) => [club.uuid, club]))
      const rankedClubs = rankedIds.flatMap((uuid) => clubById.get(uuid) ?? [])

      return await toClubDomainSources(rankedClubs)
    } catch (error) {
      // 의미 검색 장애가 문자열 검색까지 중단시키지 않도록 합니다.
      console.error(
        'semantic search unavailable:',
        error instanceof Error ? error.message : 'error',
      )
      return []
    }
  }

  // 주제의 낱말 가운데 문자열로 찾을 낱말을 고릅니다.
  // 그 낱말이 든 동아리들이 주제와 뜻으로도 가까워야 합니다.
  // 예: "보드게임 하는" → ["보드게임"]. "하는"이 든 동아리는 주제와 상관없이 흩어져 있습니다.
  async findKeywords(topic: string): Promise<string[]> {
    if (!ENV.ELICE.IS_CONFIGURED) {
      return []
    }

    try {
      const words = splitWords(topic)
      const formsOfWord = (word: string) => formsOf(word, SHORTEST_KEYWORD)

      const forms = words.flatMap(formsOfWord)
      const topicVector = await embedQuery(topic)
      const fittingForms = await this.findFittingForms(forms, topicVector)

      // 낱말마다, 뜻이 맞는 꼴 가운데 가장 덜 뗀 것을 고릅니다.
      return words.flatMap((word) => formsOfWord(word).find((form) => fittingForms.has(form)) ?? [])
    } catch (error) {
      // 낱말을 고르지 못해도 주제 전체로 하는 문자열 검색은 계속합니다.
      console.error(
        'keyword selection unavailable:',
        error instanceof Error ? error.message : 'error',
      )
      return []
    }
  }

  // 주어진 꼴 가운데, 그 꼴이 든 동아리들이 주제와 뜻으로 가까운 것을 찾습니다.
  private async findFittingForms(forms: string[], topicVector: number[]): Promise<Set<string>> {
    const vector = JSON.stringify(topicVector)

    const rows = await getPrismaClient().$queryRaw<Array<{ form: string }>>`
      WITH club_score AS (
        SELECT
          lower(concat_ws(' ', name, short_description, description, introduction)) AS text,
          1 - (embedding <=> ${vector}::vector) AS similarity
        FROM public.club
        WHERE status = ${PUBLIC_CLUB_STATUS}
          AND deleted_at IS NULL
          AND embedding_model = ${EMBEDDING_VERSION}
          AND embedding IS NOT NULL
      ),
      overall AS (
        SELECT avg(similarity) AS mean, stddev_pop(similarity) AS spread
        FROM club_score
      )
      SELECT form
      FROM unnest(${forms}::text[]) AS form, overall
      WHERE (SELECT avg(similarity) FROM club_score WHERE position(form IN text) > 0)
          > overall.mean + ${KEYWORD_LIFT}::float * overall.spread
    `
    return new Set(rows.map((row) => row.form))
  }

  // 벡터 연산은 Prisma가 지원하지 않아 raw SQL로 처리합니다.
  // 코사인 거리(<=>)는 작을수록 가깝고, 유사도는 1 - 거리입니다.
  private async rankBySimilarity(
    clubIds: string[],
    queryVector: number[],
    minSimilarity: number,
  ): Promise<string[]> {
    const ids = Prisma.join(clubIds.map((id) => Prisma.sql`${id}::uuid`))
    const vector = JSON.stringify(queryVector)

    const ranked = await getPrismaClient().$queryRaw<Array<{ uuid: string }>>`
      SELECT uuid
      FROM public.club
      WHERE uuid IN (${ids})
        AND status = ${PUBLIC_CLUB_STATUS}
        AND deleted_at IS NULL
        AND embedding_model = ${EMBEDDING_VERSION}
        AND embedding IS NOT NULL
        AND 1 - (embedding <=> ${vector}::vector) >= ${minSimilarity}
      ORDER BY embedding <=> ${vector}::vector ASC, uuid ASC
      LIMIT 20
    `
    return ranked.map((club) => club.uuid)
  }
}

// 검색어를 벡터로 바꿉니다. 같은 검색어의 벡터는 하루 동안 기억합니다.
async function embedQuery(query: string): Promise<number[]> {
  const text = normalizeQuery(query)

  return queryVectorCache.getOrLoad(text, async () => {
    const { vectors } = await createEmbeddings([text], QUERY_TIMEOUT_MS)
    return vectors[0]
  })
}
