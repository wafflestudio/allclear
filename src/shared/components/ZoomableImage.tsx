import React from 'react'
import { Image, LayoutChangeEvent, StyleSheet } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from 'react-native-reanimated'
import { clampImageScale, getPinchTranslation } from '@/shared/utils/imageViewer'

type Props = {
	url: string
	accessibilityLabel: string
}

const DOUBLE_TAP_SCALE = 2

const ZoomableImage = ({ url, accessibilityLabel }: Props) => {
	const viewportWidth = useSharedValue(0)
	const viewportHeight = useSharedValue(0)
	const scale = useSharedValue(1)
	const savedScale = useSharedValue(1)
	const translationX = useSharedValue(0)
	const translationY = useSharedValue(0)
	const savedTranslationX = useSharedValue(0)
	const savedTranslationY = useSharedValue(0)
	const pinchStartScale = useSharedValue(1)
	const pinchStartTranslationX = useSharedValue(0)
	const pinchStartTranslationY = useSharedValue(0)
	const pinchStartFocalX = useSharedValue(0)
	const pinchStartFocalY = useSharedValue(0)

	const handleLayout = (event: LayoutChangeEvent) => {
		viewportWidth.value = event.nativeEvent.layout.width
		viewportHeight.value = event.nativeEvent.layout.height
	}

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
		.onStart(event => {
			pinchStartScale.value = savedScale.value
			pinchStartTranslationX.value = savedTranslationX.value
			pinchStartTranslationY.value = savedTranslationY.value
			pinchStartFocalX.value = event.focalX
			pinchStartFocalY.value = event.focalY
		})
		.onUpdate(event => {
			const nextScale = clampImageScale(pinchStartScale.value * event.scale)
			const nextTranslation = getPinchTranslation({
				initialScale: pinchStartScale.value,
				nextScale,
				initialTranslation: {
					x: pinchStartTranslationX.value,
					y: pinchStartTranslationY.value,
				},
				initialFocal: {
					x: pinchStartFocalX.value,
					y: pinchStartFocalY.value,
				},
				currentFocal: {
					x: event.focalX,
					y: event.focalY,
				},
				viewport: {
					width: viewportWidth.value,
					height: viewportHeight.value,
				},
			})

			scale.value = nextScale
			translationX.value = nextTranslation.x
			translationY.value = nextTranslation.y
		})
		.onEnd(() => {
			savedScale.value = scale.value
			savedTranslationX.value = translationX.value
			savedTranslationY.value = translationY.value
			if (scale.value <= 1) resetZoom()
		})

	const panGesture = Gesture.Pan()
		.maxPointers(1)
		.onUpdate(event => {
			if (scale.value <= 1) return

			const maxTranslationX = (viewportWidth.value * (scale.value - 1)) / 2
			const maxTranslationY = (viewportHeight.value * (scale.value - 1)) / 2
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
			<Animated.View style={[styles.container, animatedStyle]} onLayout={handleLayout}>
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
