import React, { useEffect, useState } from 'react'
import { Image, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler'
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { Colors } from '@/shared/constants/colors'
import { typography } from '@/shared/constants/typography'
import { clampImageIndex, getAdjacentImageIndex } from '@/shared/utils/imageViewer'
import { ms, s, vs } from '@/shared/utils/scale'

type Props = {
	imageUrls: string[]
	initialIndex: number
	visible: boolean
	onClose: () => void
}

type ZoomableImageProps = {
	url: string
	index: number
	imageCount: number
}

const MAX_SCALE = 4
const DOUBLE_TAP_SCALE = 2

const ZoomableImage = ({ url, index, imageCount }: ZoomableImageProps) => {
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
			<Animated.View style={[styles.zoomContainer, animatedStyle]}>
				<Image
					source={{ uri: url }}
					style={styles.fullImage}
					resizeMode="contain"
					accessibilityLabel={`${imageCount}장 중 ${index + 1}번째 사진`}
				/>
			</Animated.View>
		</GestureDetector>
	)
}

const ImageViewerModal = ({ imageUrls, initialIndex, visible, onClose }: Props) => {
	const [currentIndex, setCurrentIndex] = useState(() =>
		clampImageIndex(initialIndex, imageUrls.length),
	)

	useEffect(() => {
		if (visible) setCurrentIndex(clampImageIndex(initialIndex, imageUrls.length))
	}, [imageUrls.length, initialIndex, visible])

	if (imageUrls.length === 0) return null

	const hasPrevious = currentIndex > 0
	const hasNext = currentIndex < imageUrls.length - 1
	const move = (direction: -1 | 1) => {
		setCurrentIndex(index => getAdjacentImageIndex(index, direction, imageUrls.length))
	}

	return (
		<Modal
			visible={visible}
			animationType="fade"
			statusBarTranslucent
			navigationBarTranslucent
			onRequestClose={onClose}>
			<GestureHandlerRootView style={styles.modalRoot}>
				<SafeAreaView style={styles.safeArea}>
					<View style={styles.header}>
						<View style={styles.headerSpacer} />
						<Text style={styles.counter}>
							{currentIndex + 1} / {imageUrls.length}
						</Text>
						<Pressable
							accessibilityRole="button"
							accessibilityLabel="사진 닫기"
							style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
							onPress={onClose}>
							<Icon name="close" size={ms(28)} color={Colors.WHITE} />
						</Pressable>
					</View>

					<View style={styles.viewer}>
						<ZoomableImage
							key={`${imageUrls[currentIndex]}-${currentIndex}`}
							url={imageUrls[currentIndex]}
							index={currentIndex}
							imageCount={imageUrls.length}
						/>
					</View>

					{imageUrls.length > 1 && (
						<View style={styles.controls}>
							<Pressable
								accessibilityRole="button"
								accessibilityLabel="이전 사진"
								disabled={!hasPrevious}
								style={({ pressed }) => [
									styles.navigationButton,
									!hasPrevious && styles.buttonDisabled,
									pressed && styles.buttonPressed,
								]}
								onPress={() => move(-1)}>
								<Icon name="chevron-left" size={ms(32)} color={Colors.WHITE} />
							</Pressable>
							<Pressable
								accessibilityRole="button"
								accessibilityLabel="다음 사진"
								disabled={!hasNext}
								style={({ pressed }) => [
									styles.navigationButton,
									!hasNext && styles.buttonDisabled,
									pressed && styles.buttonPressed,
								]}
								onPress={() => move(1)}>
								<Icon name="chevron-right" size={ms(32)} color={Colors.WHITE} />
							</Pressable>
						</View>
					)}
				</SafeAreaView>
			</GestureHandlerRootView>
		</Modal>
	)
}

export default ImageViewerModal

const styles = StyleSheet.create({
	modalRoot: {
		flex: 1,
		backgroundColor: Colors.BLACK,
	},
	safeArea: {
		flex: 1,
	},
	header: {
		minHeight: vs(56),
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: s(12),
	},
	headerSpacer: {
		width: ms(44),
		height: ms(44),
	},
	counter: {
		...typography.bodyMMedium,
		color: Colors.WHITE,
	},
	iconButton: {
		width: ms(44),
		height: ms(44),
		alignItems: 'center',
		justifyContent: 'center',
	},
	viewer: {
		flex: 1,
		overflow: 'hidden',
	},
	zoomContainer: {
		flex: 1,
	},
	fullImage: {
		width: '100%',
		height: '100%',
	},
	controls: {
		minHeight: vs(64),
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: s(32),
		paddingHorizontal: s(16),
	},
	navigationButton: {
		width: ms(48),
		height: ms(48),
		borderRadius: ms(24),
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: Colors.BODYTEXT_MAIN,
	},
	buttonDisabled: {
		opacity: 0.3,
	},
	buttonPressed: {
		opacity: 0.6,
	},
})
