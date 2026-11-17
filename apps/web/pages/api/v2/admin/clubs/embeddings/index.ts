import type { NextApiRequest, NextApiResponse } from 'next'
import { ForbiddenError } from 'server/domain/error'
import { Provider } from 'server/provider'
import { EmbeddingUpdateService } from 'server/service/embedding-update.service'
import { UserService } from 'server/service/user.service'
import { z } from 'zod'

const batchSchema = z.object({ cursor: z.string().uuid().nullable().default(null) })

// GET   검색 정보(임베딩)의 현황을 돌려줍니다.
// POST  cursor 다음의 동아리 한 묶음을 갱신합니다.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).end()
  }
  res.setHeader('Cache-Control', 'no-store')

  try {
    // middleware가 검증한 JWT의 sub만 사용합니다.
    const accountId = req.headers.user
    if (typeof accountId !== 'string') {
      return res.status(401).send('unauthorized')
    }
    await Provider.getService(UserService).assertAdminRole(accountId)

    const service = Provider.getService(EmbeddingUpdateService)

    if (req.method === 'GET') {
      const status = await service.status()
      return res.status(200).json(status)
    }

    const { cursor } = batchSchema.parse(req.body ?? {})
    const batch = await service.updateBatch(cursor)
    return res.status(200).json(batch)
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return res.status(403).send('Forbidden')
    }
    if (error instanceof z.ZodError) {
      return res.status(400).send('invalid cursor')
    }

    console.error('update embeddings:', error instanceof Error ? error.message : 'error')
    return res
      .status(503)
      .send('검색 정보 갱신에 실패했습니다. DB 설정과 임베딩 API 상태를 확인해주세요.')
  }
}
