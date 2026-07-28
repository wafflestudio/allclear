import appleAuth from '@invertase/react-native-apple-authentication'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { login as kakaoLogin } from '@react-native-seoul/kakao-login'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useContext, useState } from 'react'
import Toast from 'react-native-toast-message'
import { LOGIN_TOKEN } from '@/shared/constants/localStorage'
import { useProfile } from '@/shared/contexts/profileContext'
import { serviceContext } from '@/shared/contexts/serviceContext'
import { setToken } from '@/shared/utils/api'
import { AuthProvider } from '@/usecases/auth'

const useLoginActions = (onSuccess?: () => void) => {
	const queryClient = useQueryClient()
	const { setUser } = useProfile()
	const { authService, userService, clubService, recentSearchService } = useContext(serviceContext)
	const [isLoading, setIsLoading] = useState(false)

	const handleLoginSuccess = useCallback(
		async (token: string) => {
			await AsyncStorage.setItem(LOGIN_TOKEN, token)
			setToken(token)
			const user = await userService.getUser()
			setUser(user)
			queryClient.invalidateQueries(['savedClubs'])
			await Promise.all([
				queryClient.prefetchQuery(['savedClubs'], () => clubService.listSavedClubs(), {
					staleTime: Infinity,
				}),
				queryClient.prefetchQuery(['recentSearches'], () =>
					recentSearchService.listRecentSearches(),
				),
			])
			onSuccess?.()
			queryClient.invalidateQueries(['manageClubs'])
			Toast.show({ type: 'info', text1: '로그인 되었어요!' })
		},
		[clubService, onSuccess, queryClient, recentSearchService, setUser, userService],
	)

	const onAppleButtonPress = useCallback(async () => {
		try {
			setIsLoading(true)
			const response = await appleAuth.performRequest({
				requestedOperation: appleAuth.Operation.LOGIN,
				requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
			})

			if (!response.identityToken) return

			const token = await authService.callback(AuthProvider.APPLE, response.identityToken)
			await handleLoginSuccess(token)
		} catch {
			Toast.show({ type: 'info', text1: '로그인에 실패했어요!' })
		} finally {
			setIsLoading(false)
		}
	}, [authService, handleLoginSuccess])

	const onKakaoButtonPress = useCallback(async () => {
		try {
			setIsLoading(true)
			const result = await kakaoLogin()
			const token = await authService.callback(AuthProvider.KAKAO, result.accessToken)
			await handleLoginSuccess(token)
		} catch {
			Toast.show({ type: 'info', text1: '로그인에 실패했어요!' })
		} finally {
			setIsLoading(false)
		}
	}, [authService, handleLoginSuccess])

	return {
		isLoading,
		onAppleButtonPress,
		onKakaoButtonPress,
	}
}

export default useLoginActions
