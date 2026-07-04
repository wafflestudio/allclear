import appleAuth from '@invertase/react-native-apple-authentication'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { login as kakaoLogin } from '@react-native-seoul/kakao-login'
import { useQueryClient } from '@tanstack/react-query'
import { useProfile } from '@/shared/contexts/profileContext'
import { serviceContext } from '@/shared/contexts/serviceContext'
import React, { useContext, useState } from 'react'
import { ActivityIndicator, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import Toast from 'react-native-toast-message'
import { AuthProvider } from '@/usecases/auth'
import { LOGIN_TOKEN } from '@/shared/constants/localStorage'
import { setToken } from '@/shared/utils/api'
import { Colors } from '@/shared/constants/colors'
import { SCREEN_TYPE } from '@/shared/constants/screen'
import { typography } from '@/shared/constants/typography'
import { ms, s, vs } from '@/shared/utils/scale'
import { navigation } from '@/shared/utils/navigation'

type Props = {
	closeBottomSheet: () => void
	onSuccess?: () => void
}

const LoginView = ({ closeBottomSheet, onSuccess }: Props) => {
	const queryClient = useQueryClient()
	const { setUser } = useProfile()
	const { authService, userService, clubService, recentSearchService } = useContext(serviceContext)
	const [isLoading, setIsLoading] = useState(false)

	const handleLoginSuccess = async (token: string) => {
		await AsyncStorage.setItem(LOGIN_TOKEN, token)
		setToken(token)
		const user = await userService.getUser()
		setUser(user)
		// 저장한 동아리 및 최근 검색어는 prefetch하여 로그인 직후에 바로 보여줌
		queryClient.invalidateQueries(['savedClubs'])
		await Promise.all([
			queryClient.prefetchQuery(['savedClubs'], () => clubService.listSavedClubs(), {
				staleTime: Infinity,
			}),
			queryClient.prefetchQuery(['recentSearches'], () => recentSearchService.listRecentSearches()),
		])
		closeBottomSheet()
		onSuccess?.()
		queryClient.invalidateQueries(['manageClubs'])
		Toast.show({ type: 'info', text1: '로그인 되었어요!' })
	}

	const onAppleButtonPress = async () => {
		try {
			setIsLoading(true)
			const appleAuthRequestResponse = await appleAuth.performRequest({
				requestedOperation: appleAuth.Operation.LOGIN,
				requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
			})

			if (!appleAuthRequestResponse.identityToken) {
				return
			}

			const token = await authService.callback(
				AuthProvider.APPLE,
				appleAuthRequestResponse.identityToken,
			)
			await handleLoginSuccess(token)
		} catch {
			Toast.show({ type: 'info', text1: '로그인에 실패했어요!' })
		} finally {
			setIsLoading(false)
		}
	}

	const onKakaoButtonPress = async () => {
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
	}

	return (
		<View style={styles.mainWrapper}>
			<View style={styles.titleWrapper}>
				<View style={styles.flexRow}>
					<Text style={styles.titleBold}>로그인</Text>
					<Text style={styles.titleRegular}>이 필요해요</Text>
				</View>
			</View>
			<View>
				<Pressable
					style={[styles.button, styles.kakao, isLoading && styles.buttonDisabled]}
					onPress={onKakaoButtonPress}
					disabled={isLoading}>
					{isLoading ? (
						<ActivityIndicator color={Colors.BLACK} />
					) : (
						<>
							<Image source={require('@/assets/icons/kakao.png')} style={styles.icon} />
							<Text style={styles.kakaoText}>카카오톡으로 계속하기</Text>
						</>
					)}
				</Pressable>
				{Platform.OS === 'ios' && (
					<Pressable
						style={[styles.button, styles.apple, isLoading && styles.buttonDisabled]}
						onPress={onAppleButtonPress}
						disabled={isLoading}>
						{isLoading ? (
							<ActivityIndicator color={Colors.WHITE} />
						) : (
							<>
								<Image source={require('@/assets/icons/apple.png')} style={styles.icon} />
								<Text style={styles.appleText}>Apple로 계속하기</Text>
							</>
						)}
					</Pressable>
				)}
			</View>
			<View style={styles.termsRow}>
				<Pressable
					onPress={() => {
						closeBottomSheet()
						navigation.navigate(SCREEN_TYPE.WEBVIEW, {
							uri: 'https://www.all-clear.cc/terms/terms-of-service',
							title: '서비스 이용약관',
						})
					}}
					style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1 }]}>
					<Text style={styles.termsLink}>서비스 이용약관</Text>
				</Pressable>
				<Text style={styles.termsDivider}>|</Text>
				<Pressable
					onPress={() => {
						closeBottomSheet()
						navigation.navigate(SCREEN_TYPE.WEBVIEW, {
							uri: 'https://www.all-clear.cc/terms/privacy-policy',
							title: '개인정보 처리방침',
						})
					}}
					style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1 }]}>
					<Text style={styles.termsLink}>개인정보 처리방침</Text>
				</Pressable>
			</View>
		</View>
	)
}

export default LoginView

const styles = StyleSheet.create({
	flexRow: {
		flexDirection: 'row',
	},
	mainWrapper: {
		flex: 1,
		paddingVertical: vs(32),
		paddingHorizontal: s(24),
		backgroundColor: Colors.WHITE,
	},
	titleWrapper: {
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: vs(24),
	},
	titleBold: {
		...typography.headerL,
	},
	titleRegular: {
		...typography.headerL,
		fontFamily: 'Pretendard-Regular',
	},
	button: {
		padding: ms(16),
		borderRadius: ms(12),
		position: 'relative',
		marginBottom: vs(12),
	},
	buttonDisabled: {
		opacity: 0.6,
	},
	icon: {
		width: s(24),
		height: vs(24),
		position: 'absolute',
		top: vs(13),
		left: s(16),
	},
	apple: {
		backgroundColor: Colors.BLACK,
	},
	appleText: {
		...typography.bodyMMedium,
		color: Colors.TEXT_BUTTON_SELECTED,
		textAlign: 'center',
	},
	kakao: {
		backgroundColor: '#FEE500', // 카카오 컬러
	},
	kakaoText: {
		...typography.bodyMMedium,
		color: Colors.BLACK,
		textAlign: 'center',
	},
	termsRow: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		gap: s(8),
		marginTop: vs(10),
	},
	termsDivider: {
		...typography.bodySRegular,
		color: Colors.BODYTEXT_DISABLED,
	},
	termsLink: {
		...typography.bodySRegular,
		color: Colors.BODYTEXT_DISABLED,
	},
})
