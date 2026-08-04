import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CollegeMajor, User } from "@/entities/user";
import type { UserNotification } from "@/entities/userNotification";
import { LOGIN_TOKEN } from "@/shared/constants/localStorage";
import { apiConnector } from "@/shared/utils/api";

export type GetUserResponse = {
	profile: User;
};

export type UpdateUserRequest = Partial<Omit<User, "id">>;

export type CreateUserVoiceRequest = {
	content: string;
};

export type ListCollegeMajorsResponse = {
	majors: CollegeMajor[];
	totalSize: number;
};

export type ListCollegeMajorsRequest = {
	includeNullMajor?: boolean;
};

export type ListUserNotificationsResponse = {
	notifications: UserNotification[];
	totalSize: number;
	unreadCount: number;
};

export type ReadUserNotificationRequest = {
	id: UserNotification["id"];
};

export type UserRepository = {
	getUser: () => Promise<User>;
	updateUser: (request: UpdateUserRequest) => Promise<void>;
	createUserVoice: (request: CreateUserVoiceRequest) => Promise<void>;
	listCollegeMajors: (
		request?: ListCollegeMajorsRequest,
	) => Promise<ListCollegeMajorsResponse>;
	listNotifications: () => Promise<ListUserNotificationsResponse>;
	readNotification: (request: ReadUserNotificationRequest) => Promise<void>;
};

export const getUserRepository = (): UserRepository => ({
	getUser: async () => {
		const token = await AsyncStorage.getItem(LOGIN_TOKEN);

		if (!token) {
			throw new Error("No token found");
		}

		const response = await apiConnector.get<GetUserResponse>("/v2/users/me");

		return response.profile;
	},
	updateUser: async (request) => {
		const token = await AsyncStorage.getItem(LOGIN_TOKEN);

		if (!token) {
			throw new Error("No token found");
		}

		await apiConnector.put("/v2/users/me", request);
	},
	createUserVoice: async (request) => {
		const token = await AsyncStorage.getItem(LOGIN_TOKEN);

		if (!token) {
			throw new Error("No token found");
		}

		await apiConnector.post("/v2/users/me/voices", request);
	},
	listCollegeMajors: async (request) => {
		const response = await apiConnector.get<ListCollegeMajorsResponse>(
			"/v2/users/majors",
			request?.includeNullMajor ? { includeNullMajor: "true" } : undefined,
		);

		return response;
	},
	listNotifications: async () => {
		const token = await AsyncStorage.getItem(LOGIN_TOKEN);

		if (!token) {
			throw new Error("No token found");
		}

		const response = await apiConnector.get<ListUserNotificationsResponse>(
			"/v2/users/me/notifications",
		);

		return response;
	},
	readNotification: async (request) => {
		const token = await AsyncStorage.getItem(LOGIN_TOKEN);

		if (!token) {
			throw new Error("No token found");
		}

		await apiConnector.patch<void>(
			`/v2/users/me/notifications/${request.id}/read`,
		);
	},
});
