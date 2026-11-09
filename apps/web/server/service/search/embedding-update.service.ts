import { ENV } from 'server/ENV'
import { getPrismaClient } from 'server/infra/database/prisma'
import { Service } from 'server/provider'
import { createEmbeddings, EMBEDDING_VERSION } from './embedding'
import {
  type ClubEmbeddingSource,
  EMBEDDING_SOURCE_QUERY,
  embeddingText,
  sourceHash,
} from './embedding-document'

const needsUpdate = (club: ClubEmbeddingSource) =>
  !club.has_embedding ||
  club.embedding_model !== EMBEDDING_VERSION ||
  club.embedding_source_hash !== sourceHash(club)

@Service
export class EmbeddingUpdateService {
  async status() {
    const clubs = await getPrismaClient().$queryRaw<ClubEmbeddingSource[]>(EMBEDDING_SOURCE_QUERY)
    const pending = clubs.filter(needsUpdate).length
    const updatedAt = clubs
      .map((club) => club.embedding_updated_at)
      .filter((date): date is Date => date !== null)
      .map((date) => date.getTime())

    return {
      total: clubs.length,
      pending,
      ready: clubs.length - pending,
      lastUpdatedAt: updatedAt.length ? new Date(Math.max(...updatedAt)).toISOString() : null,
      configured: !!ENV.OPENAI.API_KEY,
    }
  }

  async updateBatch(cursor: string | null) {
    const prisma = getPrismaClient()
    const clubs = await prisma.$queryRaw<ClubEmbeddingSource[]>`
      ${EMBEDDING_SOURCE_QUERY}
      AND (${cursor}::uuid IS NULL OR c.uuid > ${cursor}::uuid)
      ORDER BY c.uuid LIMIT 20
    `
    const changed = clubs.filter(needsUpdate)
    let updated = 0
    let tokens = 0

    if (changed.length) {
      const result = await createEmbeddings(changed.map(embeddingText))
      tokens = result.tokens
      await prisma.$transaction(
        async (tx) => {
          for (const [index, club] of changed.entries()) {
            // 동시 갱신을 직렬화한 후 모집·모임·후기를 포함한 전체 입력을 다시 확인합니다.
            await tx.$queryRaw`SELECT uuid FROM public.club WHERE uuid = ${club.uuid}::uuid FOR UPDATE`
            const [current] = await tx.$queryRaw<ClubEmbeddingSource[]>`
              ${EMBEDDING_SOURCE_QUERY} AND c.uuid = ${club.uuid}::uuid
            `
            const hash = sourceHash(club)
            if (!current || !needsUpdate(current) || sourceHash(current) !== hash) continue

            updated += await tx.$executeRaw`
              UPDATE public.club
              SET embedding = ${JSON.stringify(result.vectors[index])}::vector,
                  embedding_model = ${EMBEDDING_VERSION},
                  embedding_source_hash = ${hash}, embedding_updated_at = NOW()
              WHERE uuid = ${club.uuid}::uuid AND status = 'APPROVED' AND deleted_at IS NULL
                AND (embedding IS NULL OR embedding_model IS DISTINCT FROM ${EMBEDDING_VERSION}
                     OR embedding_source_hash IS DISTINCT FROM ${hash})
            `
          }
        },
        { timeout: 30_000 },
      )
    }

    return {
      scanned: clubs.length,
      updated,
      tokens,
      nextCursor: clubs.length === 20 ? clubs[clubs.length - 1].uuid : null,
    }
  }
}
