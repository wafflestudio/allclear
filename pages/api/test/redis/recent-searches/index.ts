import type { NextApiRequest, NextApiResponse } from 'next'
import { z, ZodIssue } from 'zod'
import {
  findGuestRecentSearchDebug,
  GuestRecentSearchDebug,
} from 'server/service/recent-search.service'
import { isTestApiEnabled } from 'server/util/test-api'
import { TestGuestRecentSearchDebugQuerySchema } from 'src/lib/schemas/test'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GuestRecentSearchDebug | string | ZodIssue[]>,
) {
  if (!isTestApiEnabled()) {
    return res.status(404).send('not found')
  }

  try {
    if (req.method === 'GET') {
      const { guestId } = TestGuestRecentSearchDebugQuerySchema.parse(req.query)
      const debugResult = await findGuestRecentSearchDebug(guestId)
      return res.status(200).json(debugResult)
    }

    return res.status(405).send('method not allowed')
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json(err.errors)
    }
    console.error('testRedisRecentSearches error: ', err)
    return res.status(500).send('internal server error')
  }
}
