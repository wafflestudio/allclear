import type { NextApiRequest, NextApiResponse } from 'next'
import { ForbiddenError } from 'server/domain/error'
import { Provider } from 'server/provider'
import { EmbeddingUpdateService } from 'server/service/search/embedding-update.service'
import { UserService } from 'server/service/user.service'
import { z } from 'zod'

const batchSchema = z.object({ cursor: z.string().uuid().nullable().default(null) })

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).end()
  }
  res.setHeader('Cache-Control', 'no-store')
  try {
    // middleware가 검증한 JWT의 sub만 사용합니다.
    if (typeof req.headers.user !== 'string') return res.status(401).send('unauthorized')
    await Provider.getService(UserService).assertAdminRole(req.headers.user)
    const service = Provider.getService(EmbeddingUpdateService)
    if (req.method === 'GET') return res.status(200).json(await service.status())

    const { cursor } = batchSchema.parse(req.body ?? {})
    return res.status(200).json(await service.updateBatch(cursor))
  } catch (error) {
    if (error instanceof ForbiddenError) return res.status(403).send('Forbidden')
    if (error instanceof z.ZodError) return res.status(400).send('invalid cursor')
    console.error('update embeddings:', error instanceof Error ? error.message : 'error')
    return res
      .status(503)
      .send('검색 정보 갱신에 실패했습니다. DB 설정과 임베딩 API 상태를 확인해주세요.')
  }
}
