import React from 'react'
import { Image, StyleSheet, useWindowDimensions } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from 'react-native-reanimated'

type Props = {
	url: string
	accessibilityLabel: string
}

const MAX_SCALE = 4
const DOUBLE_TAP_SCALE = 2

const ZoomableImage = ({ url, accessibilityLabel }: Props) => {
	const { width, height } = useWindowDimensions()
	const scale = useSharedValue(1)
	const savedScale = useSharedValue(1)
	const translationX = useSharedValue(0)
	const translationY = useSharedValue(0)
	const savedTranslationX = useSharedValue(0)
	const savedTranslationY = useSharedValue(0)

	const resetZoom = () => {
		'worklet'
		scale.value = withTiming(1)
		savedScale.value = 1
		translationX.value = withSpring(0)
		translationY.value = withSpring(0)
		savedTranslationX.value = 0
		savedTranslationY.value = 0
	}

	const pinchGesture = Gesture.Pinch()
		.onUpdate(event => {
			scale.value = Math.min(Math.max(savedScale.value * event.scale, 1), MAX_SCALE)
		})
		.onEnd(() => {
			savedScale.value = scale.value
			if (scale.value <= 1) resetZoom()
		})

	const panGesture = Gesture.Pan()
		.onUpdate(event => {
			if (scale.value <= 1) return

			const maxTranslationX = (width * (scale.value - 1)) / 2
			const maxTranslationY = (height * (scale.value - 1)) / 2
			translationX.value = Math.min(
				Math.max(savedTranslationX.value + event.translationX, -maxTranslationX),
				maxTranslationX,
			)
			translationY.value = Math.min(
				Math.max(savedTranslationY.value + event.translationY, -maxTranslationY),
				maxTranslationY,
			)
		})
		.onEnd(() => {
			savedTranslationX.value = translationX.value
			savedTranslationY.value = translationY.value
		})

	const doubleTapGesture = Gesture.Tap()
		.numberOfTaps(2)
		.onEnd((_event, success) => {
			if (!success) return
			if (scale.value > 1) {
				resetZoom()
				return
			}

			scale.value = withTiming(DOUBLE_TAP_SCALE)
			savedScale.value = DOUBLE_TAP_SCALE
		})

	const gesture = Gesture.Exclusive(
		doubleTapGesture,
		Gesture.Simultaneous(pinchGesture, panGesture),
	)
	const animatedStyle = useAnimatedStyle(() => ({
		transform: [
			{ translateX: translationX.value },
			{ translateY: translationY.value },
			{ scale: scale.value },
		],
	}))

	return (
		<GestureDetector gesture={gesture}>
			<Animated.View style={[styles.container, animatedStyle]}>
				<Image
					source={{ uri: url }}
					style={styles.image}
					resizeMode="contain"
					accessibilityLabel={accessibilityLabel}
				/>
			</Animated.View>
		</GestureDetector>
	)
}

export default ZoomableImage

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	image: {
		width: '100%',
		height: '100%',
	},
})
