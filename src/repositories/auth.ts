import { AppleRequestResponse } from '@invertase/react-native-apple-authentication'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { KakaoAccessTokenInfo } from '@react-native-seoul/kakao-login'
import { apiConnector } from '@/shared/utils/api'
import { LOGIN_TOKEN } from '@/shared/constants/localStorage'

export type CallbackKakaoAuthRequest = {
	accessToken: KakaoAccessTokenInfo['accessToken']
}

export type CallbackKakaoAuthResponse = {
	token: string
}

export type CallbackAppleAuthRequest = {
	id_token: AppleRequestResponse['identityToken']
}

export type CallbackAppleAuthResponse = {
	token: string
}

export type AuthRepository = {
	callbackKakaoAuth: (request: CallbackKakaoAuthRequest) => Promise<CallbackKakaoAuthResponse>
	callbackAppleAuth: (request: CallbackAppleAuthRequest) => Promise<CallbackAppleAuthResponse>
	leave: () => Promise<void>
}

export const getAuthRepository = (): AuthRepository => ({
	callbackKakaoAuth: async (request: CallbackKakaoAuthRequest) => {
		const response = await apiConnector.post<CallbackKakaoAuthResponse>(
			'/v2/auth/kakao/native/callback',
			{
				accessToken: request.accessToken,
			},
		)

		return {
			token: response.token,
		}
	},
	callbackAppleAuth: async (request: CallbackAppleAuthRequest) => {
		const response = await apiConnector.post<CallbackAppleAuthResponse>('/v2/auth/apple/callback', {
			id_token: request.id_token,
		})

		return {
			token: response.token,
		}
	},

	leave: async () => {
		const token = await AsyncStorage.getItem(LOGIN_TOKEN)

		if (!token) {
			throw new Error('No token found')
		}

		await apiConnector.post(
			'/v2/auth/leave',
			{},
			{
				headers: {
					'x-authorization': `Bearer ${token}`,
					Authorization: `Bearer ${token}`,
				},
			},
		)
	},
})
