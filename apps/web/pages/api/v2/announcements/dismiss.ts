import type { NextApiRequest, NextApiResponse } from 'next'
import { BadRequestError, UserNotFoundError } from 'server/domain/error'
import { Provider } from 'server/provider'
import { DismissAnnouncementsSchema } from 'server/schemas/announcements'
import { AnnouncementService } from 'server/service/announcement.service'
import { type ZodIssue, z } from 'zod'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<null | string | ZodIssue[]>,
) {
  try {
    const announcementService = Provider.getService(AnnouncementService)

    if (req.method === 'POST') {
      const body = DismissAnnouncementsSchema.parse(req.body)
      await announcementService.dismissAnnouncements(
        req.headers.user as string,
        body.announcementUuids,
      )
      return res.status(204).send(null)
    }

    return res.status(405).send('method not allowed')
  } catch (err) {
    if (err instanceof UserNotFoundError) {
      return res.status(404).send('user not found')
    }
    if (err instanceof BadRequestError) {
      return res.status(400).send(err.message)
    }
    if (err instanceof z.ZodError) {
      return res.status(400).json(err.errors)
    }
    console.error('dismissAnnouncements error: ', err)
    return res.status(500).send('internal server error')
  }
}
