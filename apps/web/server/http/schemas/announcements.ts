import { z } from 'server/http/schemas/zod'
import { AnnouncementSchema } from './common'

export const DismissAnnouncementsSchema = z
  .object({
    announcementUuids: z.array(z.string().uuid()),
  })
  .openapi('DismissAnnouncements')
export const AnnouncementsResponseSchema = z
  .object({
    data: z.array(AnnouncementSchema),
  })
  .openapi('AnnouncementsResponse')
