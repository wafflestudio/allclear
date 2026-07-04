import { Announcement } from '@/entities/announcement'
import { apiConnector } from '@/shared/utils/api'

export type ListAnnouncementsResponse = {
	data: Announcement[]
}

export type DismissAnnouncementsRequest = {
	announcementUuids: Announcement['uuid'][]
}

export type AnnouncementRepository = {
	listAnnouncements: () => Promise<ListAnnouncementsResponse>
	dismissAnnouncements: (request: DismissAnnouncementsRequest) => Promise<void>
}

export const getAnnouncementRepository = (): AnnouncementRepository => ({
	listAnnouncements: async () => {
		const response = await apiConnector.get<ListAnnouncementsResponse>('/v2/announcements')

		return response
	},
	dismissAnnouncements: async request => {
		await apiConnector.post('/v2/announcements/dismiss', request)
	},
})
