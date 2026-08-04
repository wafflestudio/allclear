import analytics from "@react-native-firebase/analytics";
import type {
	EventLogParameter,
	EventLogParameterType,
} from "@/entities/eventLog";

export type EventLogService = {
	logEvent<T extends EventLogParameterType>(params: EventLogParameter<T>): void;
};

export const getEventLogService = (): EventLogService => ({
	logEvent: (params) => analytics().logEvent(params.name, params.parameters),
});
