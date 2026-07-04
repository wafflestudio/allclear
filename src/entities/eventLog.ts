/**
 * Basic Data Logging Format
 * @link __INTERNAL_DOC_REMOVED__
 */

export type EventLogParameterType = 'view' | 'click' | 'expose'

export type EventLogParameter<T extends EventLogParameterType> = {
	name: T
	parameters: T extends 'view'
		? ViewParameter
		: T extends 'click'
			? ClickParameter
			: ExposeParameter
}

type BaseParameter = {
	screen_name:
		| 'home_screen'
		| 'search_screen'
		| 'club_list_screen'
		| 'club_detail_screen'
		| 'club_review_screen'
		| 'club_ranking_screen'
		| 'saved_club_list_screen'
	device_id: string
	device_type: 'ios' | 'android'
	user_id?: string // if logged in
	[key: string]: unknown
}

export type ViewParameter = BaseParameter

export type ClickParameter = BaseParameter & {
	screen_component_name: string
}

export type ExposeParameter = BaseParameter & {
	expose_type: 'swipe' | 'scroll' | 'infinite_scroll'
}
