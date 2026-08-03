import type { User } from "@/entities/user";
import type {
	CreateUserVoiceRequest,
	ListCollegeMajorsRequest,
	ListCollegeMajorsResponse,
	ListUserNotificationsResponse,
	ReadUserNotificationRequest,
	UpdateUserRequest,
	UserRepository,
} from "@/repositories/user";

export type UserService = {
	getUser: () => Promise<User>;
	updateUser: (request: UpdateUserRequest) => Promise<void>;
	createUserVoice: (request: CreateUserVoiceRequest) => Promise<void>;
	listCollegeMajors: (
		request?: ListCollegeMajorsRequest,
	) => Promise<ListCollegeMajorsResponse>;
	listNotifications: () => Promise<ListUserNotificationsResponse>;
	readNotification: (request: ReadUserNotificationRequest) => Promise<void>;
};

type Deps = {
	repositories: [UserRepository];
};

export const getUserService = ({ repositories }: Deps): UserService => ({
	getUser: () => repositories[0].getUser(),
	updateUser: (request) => repositories[0].updateUser(request),
	createUserVoice: (request) => repositories[0].createUserVoice(request),
	listCollegeMajors: (request) => repositories[0].listCollegeMajors(request),
	listNotifications: () => repositories[0].listNotifications(),
	readNotification: (request) => repositories[0].readNotification(request),
});
