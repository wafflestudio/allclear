import React, { useEffect, useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import ZoomableImage from '@/shared/components/ZoomableImage'
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
							accessibilityLabel={`${imageUrls.length}장 중 ${currentIndex + 1}번째 사진`}
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
