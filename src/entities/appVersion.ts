export type ClientType = 'android' | 'ios'

export type VersionCheckResult = {
	updateRequired: boolean
	clientType: ClientType
	minSupportedVersion: string
	storeUrl: string
}
