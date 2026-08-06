import React, { useContext, useEffect } from "react";
import { Platform } from "react-native";
import { getUniqueIdSync } from "react-native-device-info";
import type { ViewParameter } from "@/entities/eventLog";
import { useProfile } from "@/shared/contexts/profileContext";
import { serviceContext } from "@/shared/contexts/serviceContext";

type Props = {
	params: {
		screen_name: ViewParameter["screen_name"];
		[key: string]: string;
	};
	children: React.ReactNode;
};

const WithViewEventLog = ({ params, children }: Props) => {
	const [isLogged, setIsLogged] = React.useState(false);
	const { user } = useProfile();
	const { eventLogService } = useContext(serviceContext);

	useEffect(() => {
		if (!isLogged) {
			eventLogService.logEvent({
				name: "view",
				parameters: {
					...params,
					device_id: getUniqueIdSync(),
					device_type: Platform.OS as "ios" | "android",
					user_id: user?.id ?? "",
				},
			});
			setIsLogged(true);
		}
	}, [eventLogService, isLogged, params, user?.id]);

	return <>{children}</>;
};

export default WithViewEventLog;
