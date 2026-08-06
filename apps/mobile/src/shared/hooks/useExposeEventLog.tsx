import { useContext } from "react";
import { Platform } from "react-native";
import { getUniqueIdSync } from "react-native-device-info";
import type { ExposeParameter } from "@/entities/eventLog";
import { useProfile } from "@/shared/contexts/profileContext";
import { serviceContext } from "@/shared/contexts/serviceContext";

const useExposeEventLog = () => {
	const { eventLogService } = useContext(serviceContext);
	const { user } = useProfile();

	const logExposeEvent = (params: {
		screen_name: ExposeParameter["screen_name"];
		expose_type: ExposeParameter["expose_type"];
		[key: string]: string;
	}) => {
		eventLogService.logEvent({
			name: "expose",
			parameters: {
				...params,
				device_id: getUniqueIdSync(),
				device_type: Platform.OS as "ios" | "android",
				user_id: user?.id ?? "",
			},
		});
	};

	return {
		logExposeEvent,
	};
};

export default useExposeEventLog;
