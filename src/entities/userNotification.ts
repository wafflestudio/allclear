export type UserNotificationType =
	| 'CLUB_REGISTRATION_APPROVED'
	| 'CLUB_REGISTRATION_REJECTED'
	| 'MANAGER_REQUEST_APPROVED'
	| 'MANAGER_REQUEST_REJECTED'

export type UserNotificationSourceType = 'CLUB' | 'CLUB_MANAGER_REQUEST'

export type UserNotificationMetadata = {
	rejectReason?: string
}

export type UserNotification = {
	id: string
	type: UserNotificationType
	clubId: string | null
	sourceType: UserNotificationSourceType
	sourceId: string
	metadata?: UserNotificationMetadata | null
	readAt: string | null
	createdAt: string
}
