import { NextApiRequest, NextApiResponse } from 'next'
import * as jose from 'jose'
import { ENV } from 'server/ENV'
import { AnnouncementService } from 'server/service/announcement.service'
import { Provider } from 'server/provider'
import { Announcement } from 'server/domain/model/Announcement'
import { UnauthorizedError, UserNotFoundError } from 'server/domain/error'

type ResponseData = {
  data: Announcement[]
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | string>,
) {
  try {
    const announcementService = Provider.getService(AnnouncementService)

    if (req.method === 'GET') {
      const accountId = await optionalAccountId(req)
      let data: Announcement[]
      try {
        data = await announcementService.listVisibleAnnouncements(accountId)
      } catch (err) {
        if (err instanceof UserNotFoundError) {
          data = await announcementService.listVisibleAnnouncements(null)
        } else {
          throw err
        }
      }
      return res.status(200).json({
        data,
      })
    }

    return res.status(405).send('method not allowed')
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return res.status(401).send('unauthorized')
    }
    return res.status(500).send('internal server error')
  }
}

async function optionalAccountId(req: NextApiRequest): Promise<string | null> {
  const authorizationHeader = req.headers.authorization ?? req.headers['x-authorization']
  if (!authorizationHeader || Array.isArray(authorizationHeader)) {
    return null
  }

  const token = authorizationHeader.split(' ')[1]
  if (!token) {
    return null
  }

  try {
    const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(ENV.JWT.SECRET_KEY), {
      algorithms: ['HS256'],
    })
    const accountId = payload.sub
    if (!accountId) {
      throw new UnauthorizedError('unauthorized')
    }
    return accountId
  } catch (err) {
    throw new UnauthorizedError('unauthorized')
  }
}
