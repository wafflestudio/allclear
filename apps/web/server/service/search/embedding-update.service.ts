import { ENV } from 'server/ENV'
import { ClubEntity } from 'server/infra/database/entities'
import { InjectRepository, Service } from 'server/provider'
import type { Repository } from 'typeorm'
import {
  createEmbeddings,
  EMBEDDING_VERSION,
  type EmbeddingSource,
  embeddingText,
  sourceHash,
} from './embedding'

type ClubSource = EmbeddingSource & {
  uuid: string
  embedding_model: string | null
  embedding_source_hash: string | null
  embedding_updated_at: string | null
  has_embedding: boolean
}

const SOURCE_QUERY = `
  SELECT uuid, name, short_description, description, introduction,
         embedding_model, embedding_source_hash, embedding_updated_at,
         embedding IS NOT NULL AS has_embedding
  FROM public.club
  WHERE status = 'APPROVED' AND deleted_at IS NULL`

const needsUpdate = (club: ClubSource) =>
  !club.has_embedding ||
  club.embedding_model !== EMBEDDING_VERSION ||
  club.embedding_source_hash !== sourceHash(club)

@Service
export class EmbeddingUpdateService {
  @InjectRepository(ClubEntity)
  private readonly repository: Repository<ClubEntity>

  async status() {
    const clubs: ClubSource[] = await this.repository.query(SOURCE_QUERY)
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
    const clubs: ClubSource[] = await this.repository.query(
      `${SOURCE_QUERY} AND ($1::uuid IS NULL OR uuid > $1::uuid) ORDER BY uuid LIMIT 20`,
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
          // 생성 중 원문이 수정되었다면 저장하지 않고 다음 실행에서 다시 처리합니다.
          const saved: { uuid: string }[] = await manager.query(
            `WITH saved AS (UPDATE public.club
             SET embedding = $2::vector, embedding_model = $3,
                 embedding_source_hash = $4, embedding_updated_at = NOW()
             WHERE uuid = $1 AND status = 'APPROVED' AND deleted_at IS NULL
               AND name IS NOT DISTINCT FROM $5
               AND short_description IS NOT DISTINCT FROM $6
               AND description IS NOT DISTINCT FROM $7
               AND introduction IS NOT DISTINCT FROM $8
               AND (embedding IS NULL OR embedding_model IS DISTINCT FROM $3
                    OR embedding_source_hash IS DISTINCT FROM $4)
             RETURNING uuid) SELECT uuid FROM saved`,
            [
              club.uuid,
              JSON.stringify(result.vectors[index]),
              EMBEDDING_VERSION,
              sourceHash(club),
              club.name,
              club.short_description,
              club.description,
              club.introduction,
            ],
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
