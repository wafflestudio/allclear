import { Platform } from 'react-native'
import { getVersion } from 'react-native-device-info'
import { ClientType, VersionCheckResult } from '@/entities/appVersion'
import { AppVersionRepository } from '@/repositories/appVersion'

export type AppVersionService = {
	checkCurrentVersion: () => Promise<VersionCheckResult>
}

type Deps = {
	repositories: [AppVersionRepository]
}

const getCurrentClientType = (): ClientType => (Platform.OS === 'ios' ? 'ios' : 'android')

// Android debug 빌드에는 versionNameSuffix "-DEBUG"가 붙는다.
// 서버는 semver 형태만 받으므로 suffix를 제거하고 전송한다.
const getCurrentAppVersion = (): string => getVersion().replace(/-DEBUG$/, '')

export const getAppVersionService = ({ repositories }: Deps): AppVersionService => ({
	checkCurrentVersion: () =>
		repositories[0].checkVersion({
			clientType: getCurrentClientType(),
			appVersion: getCurrentAppVersion(),
		}),
})
