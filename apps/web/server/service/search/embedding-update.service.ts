import { ENV } from 'server/ENV'
import { ClubEntity } from 'server/infra/database/entities'
import { InjectRepository, Service } from 'server/provider'
import type { Repository } from 'typeorm'
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
  @InjectRepository(ClubEntity)
  private readonly repository: Repository<ClubEntity>

  async status() {
    const clubs: ClubEmbeddingSource[] = await this.repository.query(EMBEDDING_SOURCE_QUERY)
    const pending = clubs.filter(needsUpdate).length
    const updatedAt = clubs
      .map((club) => club.embedding_updated_at)
      .filter((date): date is string => !!date)
      .map((date) => new Date(date).getTime())

    return {
      total: clubs.length,
      pending,
      ready: clubs.length - pending,
      lastUpdatedAt: updatedAt.length ? new Date(Math.max(...updatedAt)).toISOString() : null,
      configured: !!ENV.OPENAI.API_KEY,
    }
  }

  async updateBatch(cursor: string | null) {
    const clubs: ClubEmbeddingSource[] = await this.repository.query(
      `${EMBEDDING_SOURCE_QUERY} AND ($1::uuid IS NULL OR c.uuid > $1::uuid) ORDER BY c.uuid LIMIT 20`,
      [cursor],
    )
    const changed = clubs.filter(needsUpdate)
    let updated = 0
    let tokens = 0

    if (changed.length) {
      const result = await createEmbeddings(changed.map(embeddingText))
      tokens = result.tokens
      await this.repository.manager.transaction(async (manager) => {
        for (const [index, club] of changed.entries()) {
          // 동시 갱신을 직렬화한 후 모집·모임·후기를 포함한 전체 입력을 다시 확인합니다.
          await manager.query('SELECT uuid FROM public.club WHERE uuid = $1 FOR UPDATE', [
            club.uuid,
          ])
          const [current]: ClubEmbeddingSource[] = await manager.query(
            `${EMBEDDING_SOURCE_QUERY} AND c.uuid = $1`,
            [club.uuid],
          )
          const hash = sourceHash(club)
          if (!current || !needsUpdate(current) || sourceHash(current) !== hash) continue

          const saved: { uuid: string }[] = await manager.query(
            `WITH saved AS (UPDATE public.club
             SET embedding = $2::vector, embedding_model = $3,
                 embedding_source_hash = $4, embedding_updated_at = NOW()
             WHERE uuid = $1 AND status = 'APPROVED' AND deleted_at IS NULL
               AND (embedding IS NULL OR embedding_model IS DISTINCT FROM $3
                    OR embedding_source_hash IS DISTINCT FROM $4)
             RETURNING uuid) SELECT uuid FROM saved`,
            [club.uuid, JSON.stringify(result.vectors[index]), EMBEDDING_VERSION, hash],
          )
          updated += saved.length
        }
      })
    }

    return {
      scanned: clubs.length,
      updated,
      tokens,
      nextCursor: clubs.length === 20 ? clubs[clubs.length - 1].uuid : null,
    }
  }
}
