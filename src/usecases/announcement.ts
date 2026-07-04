import {
	AnnouncementRepository,
	DismissAnnouncementsRequest,
	ListAnnouncementsResponse,
} from '@/repositories/announcement'

export type AnnouncementService = {
	listAnnouncements: () => Promise<ListAnnouncementsResponse>
	dismissAnnouncements: (request: DismissAnnouncementsRequest) => Promise<void>
}

type Deps = {
	repositories: [AnnouncementRepository]
}

export const getAnnouncementService = ({ repositories }: Deps): AnnouncementService => ({
	listAnnouncements: repositories[0].listAnnouncements,
	dismissAnnouncements: repositories[0].dismissAnnouncements,
})
