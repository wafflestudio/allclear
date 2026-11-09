import type { announcementModel } from '../../infra/database/generated/prisma/models/announcement'

export type Announcement = {
  uuid: string
  title: string
  content: string
}

export const toAnnouncementDomain = (entity: announcementModel): Announcement => ({
  uuid: entity.uuid,
  title: entity.title,
  content: entity.content,
})
