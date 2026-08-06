import { AnnouncementEntity } from '../../infra/database/entities'

export type Announcement = {
  uuid: string
  title: string
  content: string
}

export const toAnnouncementDomain = (entity: AnnouncementEntity): Announcement => ({
  uuid: entity.uuid,
  title: entity.title,
  content: entity.content,
})
