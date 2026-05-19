import { NextApiRequest, NextApiResponse } from 'next'
import { z, ZodIssue } from 'zod'
import { BadRequestError, UnauthorizedError, UserNotFoundError } from 'server/domain/error'
import {
  deleteGuestRecentSearches,
  deleteMemberRecentSearches,
  findGuestRecentSearches,
  findMemberRecentSearches,
  RecentSearch,
} from 'server/service/recent-search.service'
import { assertNever } from 'server/util/assert-never'
import { resolveOptionalAuth } from 'server/util/optional-auth'

type RecentSearchesResponse = {
  recentSearches: RecentSearch[]
  totalSize: number
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RecentSearchesResponse | string | ZodIssue[]>,
) {
  try {
    const auth = await resolveOptionalAuth(req)

    if (req.method === 'GET') {
      let recentSearches: RecentSearch[]
      if (auth.type === 'member') {
        recentSearches = await findMemberRecentSearches(auth.accountId)
      } else if (auth.type === 'guest') {
        recentSearches = await findGuestRecentSearches(auth.guestId)
      } else {
        assertNever(auth)
      }

      return res.status(200).json({
        recentSearches,
        totalSize: recentSearches.length,
      })
    }

    if (req.method === 'DELETE') {
      if (auth.type === 'member') {
        await deleteMemberRecentSearches(auth.accountId)
      } else if (auth.type === 'guest') {
        await deleteGuestRecentSearches(auth.guestId)
      } else {
        assertNever(auth)
      }
      return res.status(204).end()
    }

    return res.status(405).end()
  } catch (err) {
    if (err instanceof UserNotFoundError) {
      return res.status(404).send('user not found')
    }
    if (err instanceof UnauthorizedError) {
      return res.status(401).send('unauthorized')
    }
    if (err instanceof BadRequestError) {
      return res.status(400).send(err.message)
    }
    if (err instanceof z.ZodError) {
      return res.status(400).json(err.errors)
    }
    console.error('recentSearches error: ', err)
    return res.status(500).send('internal server error')
  }
}
