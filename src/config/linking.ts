import { SCREEN_TYPE } from '@/shared/constants/screen'
import { ENV } from '@/config/ENV'

export const linking = {
	prefixes: ['allclear://', 'https://all-clear.cc', 'https://dev.all-clear.cc', ENV.WEB_URL],
	config: {
		screens: {
			HomeTab: {
				screens: {
					[SCREEN_TYPE.CLUB_DETAIL]: 'club/:uuid',
				},
			},
		},
	},
}
