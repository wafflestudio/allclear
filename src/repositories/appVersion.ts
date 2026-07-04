import { ClientType, VersionCheckResult } from '@/entities/appVersion'
import { apiConnector } from '@/shared/utils/api'

export type CheckVersionRequest = {
	clientType: ClientType
	appVersion: string
}

export type AppVersionRepository = {
	checkVersion: (request: CheckVersionRequest) => Promise<VersionCheckResult>
}

export const getAppVersionRepository = (): AppVersionRepository => ({
	checkVersion: async request => {
		const response = await apiConnector.post<VersionCheckResult>('/v2/app/version/check', request)
		return response
	},
})
