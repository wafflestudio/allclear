import { createContext } from "react";
import type { AnnouncementService } from "@/usecases/announcement";
import type { AppVersionService } from "@/usecases/appVersion";
import type { AuthService } from "@/usecases/auth";
import type { CategoryService } from "@/usecases/category";
import type { ClubService } from "@/usecases/club";
import type { EventLogService } from "@/usecases/eventLog";
import type { RecentSearchService } from "@/usecases/recentSearch";
import type { RecruitmentService } from "@/usecases/recruitment";
import type { ReviewService } from "@/usecases/review";
import type { TermService } from "@/usecases/term";
import type { UserService } from "@/usecases/user";

type ServiceContext = {
	announcementService: AnnouncementService;
	appVersionService: AppVersionService;
	authService: AuthService;
	categoryService: CategoryService;
	clubService: ClubService;
	eventLogService: EventLogService;
	recentSearchService: RecentSearchService;
	recruitmentService: RecruitmentService;
	reviewService: ReviewService;
	termService: TermService;
	userService: UserService;
};

export const serviceContext = createContext<ServiceContext>(
	{} as ServiceContext,
);
