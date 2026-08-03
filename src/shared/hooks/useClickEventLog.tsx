import { useContext } from "react";
import { Platform } from "react-native";
import { getUniqueIdSync } from "react-native-device-info";
import type { ClickParameter } from "@/entities/eventLog";
import { useProfile } from "@/shared/contexts/profileContext";
import { serviceContext } from "@/shared/contexts/serviceContext";

const useClickEventLog = () => {
	const { eventLogService } = useContext(serviceContext);
	const { user } = useProfile();

	const logClickEvent = (params: {
		screen_name: ClickParameter["screen_name"];
		screen_component_name: ClickParameter["screen_component_name"];
		[key: string]: string;
	}) => {
		eventLogService.logEvent({
			name: "click",
			parameters: {
				...params,
				device_id: getUniqueIdSync(),
				device_type: Platform.OS as "ios" | "android",
				user_id: user?.id ?? "",
			},
		});
	};

	return {
		logClickEvent,
	};
};

export default useClickEventLog;
