import { useMemo } from 'react'
import {
	Extrapolation,
	interpolate,
	type SharedValue,
	useAnimatedStyle,
	useDerivedValue,
} from 'react-native-reanimated'
import { ENTRY_SPLASH_SYMBOL_SIZE, getCenteredScaledAssetOrigin } from '@/shared/utils/entrySplash'

type Params = {
	introProgress: SharedValue<number>
	loginProgress: SharedValue<number>
	scaleX: number
	scaleY: number
	screenOpacity: SharedValue<number>
}

const useEntrySplashAnimatedStyles = ({
	introProgress,
	loginProgress,
	scaleX,
	scaleY,
	screenOpacity,
}: Params) => {
	const visualProgress = useDerivedValue(() => introProgress.value + loginProgress.value)

	const taglineLayoutStyle = useMemo(
		() => ({
			fontFamily: 'Pretendard-Bold',
			fontSize: 18 * scaleX,
			lineHeight: 30 * scaleX,
			letterSpacing: -0.36 * scaleX,
		}),
		[scaleX],
	)

	const screenStyle = useAnimatedStyle(() => ({
		opacity: screenOpacity.value,
	}))

	const symbolStyle = useAnimatedStyle(() => {
		const designLeft = interpolate(
			visualProgress.value,
			[0, 1, 2, 3],
			[160.556, 111.03, 79, 78.59],
			Extrapolation.CLAMP,
		)
		const designTop = interpolate(
			visualProgress.value,
			[0, 1, 2, 3],
			[396.561, 396.56, 396.56, 337.56],
			Extrapolation.CLAMP,
		)

		return {
			left: getCenteredScaledAssetOrigin({
				designOrigin: designLeft,
				designSize: 80.906,
				renderedSize: ENTRY_SPLASH_SYMBOL_SIZE,
				scale: scaleX,
			}),
			top: getCenteredScaledAssetOrigin({
				designOrigin: designTop,
				designSize: 80.906,
				renderedSize: ENTRY_SPLASH_SYMBOL_SIZE,
				scale: scaleY,
			}),
			width: ENTRY_SPLASH_SYMBOL_SIZE,
			height: ENTRY_SPLASH_SYMBOL_SIZE,
		}
	})

	const taglineStyle = useAnimatedStyle(() => ({
		left:
			interpolate(
				visualProgress.value,
				[0, 1, 2, 3],
				[117.556, 79.44, 79.44, 79.03],
				Extrapolation.CLAMP,
			) * scaleX,
		top:
			interpolate(
				visualProgress.value,
				[0, 1, 2, 3],
				[739, 356.56, 356.56, 297.56],
				Extrapolation.CLAMP,
			) * scaleY,
	}))

	const smallWordmarkStyle = useAnimatedStyle(() => ({
		left:
			interpolate(visualProgress.value, [0, 1], [164.556, 194.03], Extrapolation.CLAMP) * scaleX,
		top: interpolate(visualProgress.value, [0, 1], [779, 406.5], Extrapolation.CLAMP) * scaleY,
		width:
			interpolate(visualProgress.value, [0, 1], [72.497, 96.932], Extrapolation.CLAMP) * scaleX,
		height:
			interpolate(visualProgress.value, [0, 1], [29.294, 59.489], Extrapolation.CLAMP) * scaleX,
		opacity: interpolate(visualProgress.value, [0, 0.7, 1], [1, 1, 0], Extrapolation.CLAMP),
	}))

	const transitionWordmarkStyle = useAnimatedStyle(() => ({
		left: interpolate(visualProgress.value, [1, 2], [194.03, 174.91], Extrapolation.CLAMP) * scaleX,
		top: 406.5 * scaleY,
		width: 96.932 * scaleX,
		height: 59.489 * scaleX,
		opacity: interpolate(visualProgress.value, [0.7, 1, 1.7, 2], [0, 1, 1, 0], Extrapolation.CLAMP),
	}))

	const wordmarkStyle = useAnimatedStyle(() => ({
		left: interpolate(visualProgress.value, [2, 3], [174.91, 174.5], Extrapolation.CLAMP) * scaleX,
		top: interpolate(visualProgress.value, [2, 3], [406.5, 347.5], Extrapolation.CLAMP) * scaleY,
		width: 147.222 * scaleX,
		height: 59.489 * scaleX,
		opacity: interpolate(visualProgress.value, [1.7, 2], [0, 1], Extrapolation.CLAMP),
	}))

	return {
		screenStyle,
		smallWordmarkStyle,
		symbolStyle,
		taglineLayoutStyle,
		taglineStyle,
		transitionWordmarkStyle,
		visualProgress,
		wordmarkStyle,
	}
}

export default useEntrySplashAnimatedStyles
