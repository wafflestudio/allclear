import { createContext } from 'react'
import { AnnouncementService } from '@/usecases/announcement'
import { AppVersionService } from '@/usecases/appVersion'
import { AuthService } from '@/usecases/auth'
import { CategoryService } from '@/usecases/category'
import { ClubService } from '@/usecases/club'
import { EventLogService } from '@/usecases/eventLog'
import { RecentSearchService } from '@/usecases/recentSearch'
import { ReviewService } from '@/usecases/review'
import { TermService } from '@/usecases/term'
import { UserService } from '@/usecases/user'

type ServiceContext = {
	announcementService: AnnouncementService
	appVersionService: AppVersionService
	authService: AuthService
	categoryService: CategoryService
	clubService: ClubService
	eventLogService: EventLogService
	recentSearchService: RecentSearchService
	reviewService: ReviewService
	termService: TermService
	userService: UserService
}

export const serviceContext = createContext<ServiceContext>({} as ServiceContext)
