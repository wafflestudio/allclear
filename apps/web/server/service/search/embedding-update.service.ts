import { ENV } from 'server/ENV'
import { getPrismaClient } from 'server/infra/database/prisma'
import { Service } from 'server/provider'
import { createEmbeddings, EMBEDDING_VERSION } from './embedding'
import { buildEmbeddingDocument } from './embedding-document'
import { type ClubEmbeddingSource, EMBEDDING_SOURCE_QUERY } from './embedding-source'

const BATCH_SIZE = 20
type PendingEmbedding = { uuid: string; text: string; hash: string }

@Service
export class EmbeddingUpdateService {
  async status() {
    const clubs = await getPrismaClient().$queryRaw<ClubEmbeddingSource[]>(EMBEDDING_SOURCE_QUERY)
    const pending = pendingEmbeddings(clubs).length
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
      ORDER BY c.uuid LIMIT ${BATCH_SIZE}
    `
    const progress = {
      scanned: clubs.length,
      nextCursor: clubs.length === BATCH_SIZE ? clubs[clubs.length - 1].uuid : null,
    }
    const pending = pendingEmbeddings(clubs)
    if (pending.length === 0) return { ...progress, updated: 0, tokens: 0 }

    const { vectors, tokens } = await createEmbeddings(pending.map(({ text }) => text))
    const updated = await this.saveEmbeddings(pending, vectors)
    return { ...progress, updated, tokens }
  }

  private async saveEmbeddings(pending: PendingEmbedding[], vectors: number[][]) {
    return getPrismaClient().$transaction(
      async (tx) => {
        let updated = 0
        for (const [index, { uuid, hash }] of pending.entries()) {
          // API 호출 중 바뀐 문서는 건너뛰고, 같은 동아리의 중복 저장은 직렬화합니다.
          await tx.$queryRaw`SELECT uuid FROM public.club WHERE uuid = ${uuid}::uuid FOR UPDATE`
          const [current] = await tx.$queryRaw<ClubEmbeddingSource[]>`
            ${EMBEDDING_SOURCE_QUERY} AND c.uuid = ${uuid}::uuid
          `
          if (!current || buildEmbeddingDocument(current.document).hash !== hash) continue

          updated += await tx.$executeRaw`
            UPDATE public.club
            SET embedding = ${JSON.stringify(vectors[index])}::vector,
                embedding_model = ${EMBEDDING_VERSION},
                embedding_source_hash = ${hash}, embedding_updated_at = NOW()
            WHERE uuid = ${uuid}::uuid AND status = 'APPROVED' AND deleted_at IS NULL
              AND (embedding IS NULL OR embedding_model IS DISTINCT FROM ${EMBEDDING_VERSION}
                   OR embedding_source_hash IS DISTINCT FROM ${hash})
          `
        }
        return updated
      },
      { timeout: 30_000 },
    )
  }
}

function pendingEmbeddings(clubs: ClubEmbeddingSource[]): PendingEmbedding[] {
  const pending: PendingEmbedding[] = []
  for (const club of clubs) {
    const document = buildEmbeddingDocument(club.document)
    const current =
      club.has_embedding &&
      club.embedding_model === EMBEDDING_VERSION &&
      club.embedding_source_hash === document.hash

    if (!current) pending.push({ uuid: club.uuid, ...document })
  }
  return pending
}
