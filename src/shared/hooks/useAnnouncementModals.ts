import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Announcement } from '@/entities/announcement'
import { serviceContext } from '@/shared/contexts/serviceContext'
import { AnnouncementService } from '@/usecases/announcement'
import { useContext, useEffect, useState } from 'react'

type HomeAnnouncementModalItem = {
	key: string
	uuid: string
	title: string
	description: string
}

let hasShownAnnouncementsThisSession = false

const useAnnouncementModals = () => {
	const { announcementService } = useContext(serviceContext)
	const queryClient = useQueryClient()
	const [modalQueue, setModalQueue] = useState<HomeAnnouncementModalItem[]>([])
	const { data: announcements = [], isSuccess: hasLoadedAnnouncements } =
		useAnnouncements(announcementService)
	const dismissAnnouncementsMutation = useDismissAnnouncements(announcementService, queryClient)

	useEffect(() => {
		if (!hasLoadedAnnouncements) return
		if (hasShownAnnouncementsThisSession) return

		setModalQueue(announcements.map(createAnnouncementModalItem))
		hasShownAnnouncementsThisSession = true
	}, [announcements, hasLoadedAnnouncements])

	const handleCloseAnnouncement = () => {
		setModalQueue(prev => prev.slice(1))
	}

	const handleHideAnnouncement = () => {
		const currentAnnouncement = modalQueue[0]

		if (!currentAnnouncement) return

		dismissAnnouncementsMutation.mutate([currentAnnouncement.uuid])
		setModalQueue(prev => prev.slice(1))
	}

	return {
		currentAnnouncement: modalQueue[0],
		handleCloseAnnouncement,
		handleHideAnnouncement,
	}
}

export default useAnnouncementModals

const createAnnouncementModalItem = (announcement: Announcement): HomeAnnouncementModalItem => ({
	key: `announcement-${announcement.uuid}`,
	uuid: announcement.uuid,
	title: announcement.title,
	description: announcement.content,
})

const useAnnouncements = (announcementService: AnnouncementService) => {
	return useQuery({
		queryKey: ['announcements'],
		queryFn: () => announcementService.listAnnouncements(),
		select: data => data.data,
		staleTime: 60 * 1000,
	})
}

const useDismissAnnouncements = (
	announcementService: AnnouncementService,
	queryClient: ReturnType<typeof useQueryClient>,
) => {
	return useMutation({
		mutationFn: (announcementUuids: Announcement['uuid'][]) =>
			announcementService.dismissAnnouncements({ announcementUuids }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['announcements'] })
		},
	})
}
