import { Club } from '@/entities/club'

export enum SCREEN_TYPE {
	HOME = 'Home',

	SEARCH = 'Search',

	CLUB_LIST = 'ClubList',
	SAVED_CLUB_LIST = 'SavedClubList',

	CLUB_DETAIL = 'ClubDetail',
	CLUB_REVIEW = 'ClubReview',

	MYPAGE = 'MyPage',
	EDIT_PROFILE = 'EditProfile',
	MANAGE_CLUB_REGISTRATION = 'ManageClubRegistration',

	ANNOUNCEMENT_REGISTRATION = 'AnnouncementRegistration',
	ANNOUNCEMENT_EDIT = 'AnnouncementEdit',
	CLUB_MANAGEMENT = 'ClubManagement',
	CLUB_INFO_EDIT = 'ClubInfoEdit',

	WEBVIEW = 'WebView',
}

export type StackParamList = {
	[SCREEN_TYPE.HOME]: undefined

	[SCREEN_TYPE.SEARCH]: undefined

	[SCREEN_TYPE.CLUB_LIST]: {
		name?: Club['name']
		category?: Club['category']
	}
	[SCREEN_TYPE.SAVED_CLUB_LIST]: undefined

	[SCREEN_TYPE.CLUB_DETAIL]: {
		uuid: Club['uuid']
		category?: Club['category']
		entry_point?:
			| 'home'
			| 'search_result'
			| 'club_list'
			| 'club_detail'
			| 'club_review'
			| 'popular_clubs'
	}
	[SCREEN_TYPE.CLUB_REVIEW]: {
		uuid: Club['uuid']
		category: Club['category']
	}

	[SCREEN_TYPE.EDIT_PROFILE]: undefined
	[SCREEN_TYPE.MYPAGE]: undefined
	[SCREEN_TYPE.MANAGE_CLUB_REGISTRATION]: undefined

	[SCREEN_TYPE.ANNOUNCEMENT_REGISTRATION]: { clubId: string }
	[SCREEN_TYPE.ANNOUNCEMENT_EDIT]: { recruitmentId: number }
	[SCREEN_TYPE.CLUB_MANAGEMENT]: { clubId: string }
	[SCREEN_TYPE.CLUB_INFO_EDIT]: { clubId: string }

	[SCREEN_TYPE.WEBVIEW]: { uri: string; title?: string; authorization?: string }
}
