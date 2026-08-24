import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext, useEffect, useState } from "react";
import type { Announcement } from "@/entities/announcement";
import { serviceContext } from "@/shared/contexts/serviceContext";
import type { AnnouncementService } from "@/usecases/announcement";

export type HomeAnnouncementModalItem = {
	key: string;
	uuid: string;
	title: string;
	description: string;
};

let hasShownAnnouncementsThisSession = false;

const useAnnouncementModals = (enabled = true) => {
	const { announcementService } = useContext(serviceContext);
	const queryClient = useQueryClient();
	const [modalQueue, setModalQueue] = useState<HomeAnnouncementModalItem[]>([]);
	const [hasInitializedAnnouncements, setHasInitializedAnnouncements] =
		useState(false);
	const {
		data: announcements = [],
		isSuccess: hasLoadedAnnouncements,
		isError: hasAnnouncementsError,
	} = useAnnouncements(announcementService, enabled);
	const dismissAnnouncementsMutation = useDismissAnnouncements(
		announcementService,
		queryClient,
	);

	useEffect(() => {
		if (!enabled) {
			setModalQueue([]);
			setHasInitializedAnnouncements(false);
			return;
		}
		if (hasAnnouncementsError) {
			setHasInitializedAnnouncements(true);
			return;
		}
		if (!hasLoadedAnnouncements) return;
		if (hasShownAnnouncementsThisSession) {
			setHasInitializedAnnouncements(true);
			return;
		}

		setModalQueue(announcements.map(createAnnouncementModalItem));
		hasShownAnnouncementsThisSession = true;
		setHasInitializedAnnouncements(true);
	}, [announcements, enabled, hasAnnouncementsError, hasLoadedAnnouncements]);

	const handleCloseAnnouncement = () => {
		setModalQueue((prev) => prev.slice(1));
	};

	const handleHideAnnouncement = () => {
		const currentAnnouncement = modalQueue[0];

		if (!currentAnnouncement) return;

		dismissAnnouncementsMutation.mutate([currentAnnouncement.uuid]);
		setModalQueue((prev) => prev.slice(1));
	};

	return {
		currentAnnouncement: modalQueue[0],
		hasResolvedAnnouncements:
			enabled && (hasAnnouncementsError || hasInitializedAnnouncements),
		handleCloseAnnouncement,
		handleHideAnnouncement,
	};
};

export default useAnnouncementModals;

const createAnnouncementModalItem = (
	announcement: Announcement,
): HomeAnnouncementModalItem => ({
	key: `announcement-${announcement.uuid}`,
	uuid: announcement.uuid,
	title: announcement.title,
	description: announcement.content,
});

const useAnnouncements = (
	announcementService: AnnouncementService,
	enabled: boolean,
) => {
	return useQuery({
		queryKey: ["announcements"],
		queryFn: () => announcementService.listAnnouncements(),
		select: (data) => data.data,
		enabled,
		staleTime: 60 * 1000,
	});
};

const useDismissAnnouncements = (
	announcementService: AnnouncementService,
	queryClient: ReturnType<typeof useQueryClient>,
) => {
	return useMutation({
		mutationFn: (announcementUuids: Announcement["uuid"][]) =>
			announcementService.dismissAnnouncements({ announcementUuids }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["announcements"] });
		},
	});
};
