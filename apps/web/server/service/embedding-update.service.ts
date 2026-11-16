import { ENV } from 'server/ENV'
import { createEmbeddings, EMBEDDING_VERSION } from 'server/infra/client/elice'
import { getPrismaClient } from 'server/infra/database/prisma'
import { Service } from 'server/provider'
import { buildEmbeddingDocument } from './embedding-update/embedding-document'
import {
  type ClubEmbeddingSource,
  EMBEDDING_SOURCE_QUERY,
} from './embedding-update/embedding-source'

// 한 번의 요청에서 확인하는 동아리 수
const BATCH_SIZE = 20

const EMBEDDING_TIMEOUT_MS = 30_000
const SAVE_TIMEOUT_MS = 30_000

// 임베딩을 새로 만들어야 하는 동아리와 그 문서
type PendingEmbedding = {
  uuid: string
  text: string
  hash: string
}

@Service
export class EmbeddingUpdateService {
  // 관리자 화면에 보여줄 현황입니다.
  async status() {
    const clubs = await getPrismaClient().$queryRaw<ClubEmbeddingSource[]>(EMBEDDING_SOURCE_QUERY)
    const pending = findPending(clubs)

    return {
      total: clubs.length,
      pending: pending.length,
      ready: clubs.length - pending.length,
      lastUpdatedAt: findLastUpdatedAt(clubs),
      configured: ENV.ELICE.IS_CONFIGURED,
    }
  }

  // cursor 다음의 동아리 한 묶음을 확인하고, 문서가 달라진 동아리만 임베딩을 다시 만듭니다.
  // 화면은 nextCursor가 null이 될 때까지 이어서 호출합니다.
  async updateBatch(cursor: string | null) {
    const clubs = await this.readBatch(cursor)

    const hasNextBatch = clubs.length === BATCH_SIZE
    const progress = {
      scanned: clubs.length,
      nextCursor: hasNextBatch ? clubs[clubs.length - 1].uuid : null,
    }

    const pending = findPending(clubs)
    if (pending.length === 0) {
      return { ...progress, updated: 0, tokens: 0 }
    }

    const texts = pending.map((embedding) => embedding.text)
    const { vectors, tokens } = await createEmbeddings(texts, EMBEDDING_TIMEOUT_MS)
    const updated = await this.save(pending, vectors)

    return { ...progress, updated, tokens }
  }

  private readBatch(cursor: string | null) {
    return getPrismaClient().$queryRaw<ClubEmbeddingSource[]>`
      ${EMBEDDING_SOURCE_QUERY}
        AND (${cursor}::uuid IS NULL OR c.uuid > ${cursor}::uuid)
      ORDER BY c.uuid
      LIMIT ${BATCH_SIZE}
    `
  }

  // 벡터를 저장하고, 저장한 동아리 수를 돌려줍니다.
  private save(pending: PendingEmbedding[], vectors: number[][]): Promise<number> {
    return getPrismaClient().$transaction(
      async (tx) => {
        let updated = 0

        for (const [index, { uuid, hash }] of pending.entries()) {
          // 같은 동아리를 동시에 저장하지 않도록 row를 잠급니다.
          await tx.$queryRaw`SELECT uuid FROM public.club WHERE uuid = ${uuid}::uuid FOR UPDATE`

          // 임베딩 API를 기다리는 사이 문서가 바뀐 동아리는 건너뜁니다. 다음 갱신에서 처리됩니다.
          const [current] = await tx.$queryRaw<ClubEmbeddingSource[]>`
            ${EMBEDDING_SOURCE_QUERY} AND c.uuid = ${uuid}::uuid
          `
          const isUnchanged =
            current !== undefined && buildEmbeddingDocument(current.document).hash === hash
          if (!isUnchanged) {
            continue
          }

          const vector = JSON.stringify(vectors[index])

          updated += await tx.$executeRaw`
            UPDATE public.club
            SET embedding = ${vector}::vector,
                embedding_model = ${EMBEDDING_VERSION},
                embedding_source_hash = ${hash},
                embedding_updated_at = NOW()
            WHERE uuid = ${uuid}::uuid
              AND status = 'APPROVED'
              AND deleted_at IS NULL
              AND (
                embedding IS NULL
                OR embedding_model IS DISTINCT FROM ${EMBEDDING_VERSION}
                OR embedding_source_hash IS DISTINCT FROM ${hash}
              )
          `
        }
        return updated
      },
      { timeout: SAVE_TIMEOUT_MS },
    )
  }
}

// 임베딩이 없거나, 모델 또는 문서가 달라진 동아리를 고릅니다.
function findPending(clubs: ClubEmbeddingSource[]): PendingEmbedding[] {
  const pending: PendingEmbedding[] = []

  for (const club of clubs) {
    const document = buildEmbeddingDocument(club.document)

    const isUpToDate =
      club.has_embedding &&
      club.embedding_model === EMBEDDING_VERSION &&
      club.embedding_source_hash === document.hash

    if (!isUpToDate) {
      pending.push({ uuid: club.uuid, ...document })
    }
  }
  return pending
}

function findLastUpdatedAt(clubs: ClubEmbeddingSource[]): string | null {
  const times = clubs
    .map((club) => club.embedding_updated_at)
    .filter((date): date is Date => date !== null)
    .map((date) => date.getTime())

  if (times.length === 0) {
    return null
  }
  return new Date(Math.max(...times)).toISOString()
}
