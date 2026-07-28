import React, { useMemo } from 'react'
import { ActivityIndicator, Image, Platform, Pressable, StyleSheet, Text } from 'react-native'
import Animated, {
	Extrapolation,
	interpolate,
	type SharedValue,
	useAnimatedStyle,
} from 'react-native-reanimated'
import { Colors } from '@/shared/constants/colors'
import { typography } from '@/shared/constants/typography'

type Props = {
	isLoading: boolean
	isReady: boolean
	onAppleButtonPress: () => void
	onKakaoButtonPress: () => void
	scaleX: number
	scaleY: number
	visualProgress: SharedValue<number>
}

const EntryLoginActions = ({
	isLoading,
	isReady,
	onAppleButtonPress,
	onKakaoButtonPress,
	scaleX,
	scaleY,
	visualProgress,
}: Props) => {
	const layoutStyles = useMemo(
		() => ({
			actions: {
				top: 468.44 * scaleY,
				left: 53.5 * scaleX,
				width: 295 * scaleX,
				gap: 12 * scaleY,
			},
			button: {
				height: 48 * scaleY,
				borderRadius: 12 * scaleX,
			},
			icon: {
				top: 16 * scaleY,
				left: 16 * scaleX,
				width: 16 * scaleX,
				height: 16 * scaleX,
			},
		}),
		[scaleX, scaleY],
	)

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: interpolate(visualProgress.value, [2, 3], [0, 1], Extrapolation.CLAMP),
		transform: [
			{
				translateY:
					interpolate(visualProgress.value, [2, 3], [12, 0], Extrapolation.CLAMP) * scaleY,
			},
		],
	}))

	return (
		<Animated.View
			pointerEvents={isReady ? 'auto' : 'none'}
			style={[styles.actions, layoutStyles.actions, animatedStyle]}>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel="카카오톡으로 계속하기"
				disabled={isLoading}
				onPress={onKakaoButtonPress}
				style={({ pressed }) => [
					styles.button,
					styles.kakaoButton,
					layoutStyles.button,
					(pressed || isLoading) && styles.buttonPressed,
				]}>
				{isLoading ? (
					<ActivityIndicator color={Colors.BLACK} />
				) : (
					<>
						<Image
							source={require('@/assets/icons/kakao.png')}
							style={[styles.icon, layoutStyles.icon]}
						/>
						<Text style={styles.kakaoText}>카카오톡으로 계속하기</Text>
					</>
				)}
			</Pressable>

			{Platform.OS === 'ios' && (
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Apple로 계속하기"
					disabled={isLoading}
					onPress={onAppleButtonPress}
					style={({ pressed }) => [
						styles.button,
						styles.appleButton,
						layoutStyles.button,
						(pressed || isLoading) && styles.buttonPressed,
					]}>
					{isLoading ? (
						<ActivityIndicator color={Colors.WHITE} />
					) : (
						<>
							<Image
								source={require('@/assets/icons/apple.png')}
								style={[styles.icon, layoutStyles.icon]}
							/>
							<Text style={styles.appleText}>Apple로 계속하기</Text>
						</>
					)}
				</Pressable>
			)}
		</Animated.View>
	)
}

export default EntryLoginActions

const styles = StyleSheet.create({
	actions: {
		position: 'absolute',
	},
	button: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	buttonPressed: {
		opacity: 0.6,
	},
	kakaoButton: {
		backgroundColor: Colors.KAKAO,
	},
	appleButton: {
		backgroundColor: Colors.BLACK,
	},
	icon: {
		position: 'absolute',
	},
	kakaoText: {
		...typography.bodyMMedium,
		color: Colors.BLACK,
	},
	appleText: {
		...typography.bodyMMedium,
		color: Colors.WHITE,
	},
})
