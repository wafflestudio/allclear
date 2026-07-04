import { BlurView } from '@react-native-community/blur'
import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { Colors } from '@/shared/constants/colors'
import { typography } from '@/shared/constants/typography'
import { ms, s, vs } from '@/shared/utils/scale'
import { ClubDetailTabLabel } from './ClubDetailTabBar'

type Props = {
	clubName: string
	tabLabel: ClubDetailTabLabel
	onLoginPress: () => void
}

const LoginBlurOverlay = ({ clubName, tabLabel, onLoginPress }: Props) => (
	<>
		<View style={styles.blurWrapper}>
			<BlurView
				style={StyleSheet.absoluteFill}
				blurType="light"
				// overlayColor="transparent"
				overlayColor="rgba(255,255,255,0.6)"
				blurAmount={8}
				reducedTransparencyFallbackColor="white"
			/>
		</View>
		<View style={styles.loginOverlay}>
			<Text style={styles.loginText}>
				<Text style={styles.clubName}>{clubName}</Text>
				{'의 ' + tabLabel + '를 보려면'}
			</Text>
			<Text style={styles.loginText}>로그인이 필요해요!</Text>
			<Pressable
				style={({ pressed }) => [styles.loginButton, pressed && styles.loginButtonPressed]}
				onPress={onLoginPress}>
				<Text style={styles.loginButtonText}>로그인 하러 가기</Text>
			</Pressable>
		</View>
	</>
)

export default LoginBlurOverlay

const styles = StyleSheet.create({
	blurWrapper: {
		borderRadius: ms(16),
		overflow: 'hidden',
		position: 'absolute',
		top: 0,
		left: 0,
		bottom: 0,
		right: 0,
		zIndex: 1,
	},
	loginOverlay: {
		position: 'absolute',
		left: 0,
		right: 0,
		zIndex: 2,
		top: vs(40),
		alignItems: 'center',
	},
	loginText: {
		...typography.bodyMRegular,
		color: Colors.BODYTEXT_SUB,
		textAlign: 'center',
		marginTop: vs(8),
	},
	clubName: {
		...typography.bodyMSemibold,
		color: Colors.BODYTEXT_MAIN,
	},
	loginButton: {
		marginTop: vs(12),
		paddingVertical: vs(4),
		paddingHorizontal: s(8),
	},
	loginButtonPressed: {
		opacity: 0.4,
	},
	loginButtonText: {
		...typography.bodyMSemibold,
		color: Colors.BODYTEXT_MAIN,
		textDecorationLine: 'underline',
	},
})
