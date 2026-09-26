import { useEffect, useRef, useState } from "react";
import {
	FlatList,
	type LayoutChangeEvent,
	Modal,
	type NativeScrollEvent,
	type NativeSyntheticEvent,
	Pressable,
	StatusBar,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import ZoomableImage from "@/shared/components/ZoomableImage";
import { Colors } from "@/shared/constants/colors";
import { typography } from "@/shared/constants/typography";
import {
	clampImageIndex,
	getAdjacentImageIndex,
} from "@/shared/utils/imageViewer";
import { ms, s, vs } from "@/shared/utils/scale";

type Props = {
	imageUrls: string[];
	initialIndex: number;
	visible: boolean;
	onClose: () => void;
};

const ImageViewerModal = ({
	imageUrls,
	initialIndex,
	visible,
	onClose,
}: Props) => {
	const [currentIndex, setCurrentIndex] = useState(() =>
		clampImageIndex(initialIndex, imageUrls.length),
	);
	const [viewerWidth, setViewerWidth] = useState(0);
	const [isImageZoomed, setIsImageZoomed] = useState(false);
	const imageListRef = useRef<FlatList<string>>(null);

	useEffect(() => {
		if (visible) {
			setCurrentIndex(clampImageIndex(initialIndex, imageUrls.length));
			setIsImageZoomed(false);
		}
	}, [imageUrls.length, initialIndex, visible]);

	useEffect(() => {
		if (!visible || viewerWidth === 0) return;

		imageListRef.current?.scrollToOffset({
			offset: currentIndex * viewerWidth,
			animated: false,
		});
	}, [currentIndex, viewerWidth, visible]);

	if (imageUrls.length === 0) return null;

	const hasPrevious = currentIndex > 0;
	const hasNext = currentIndex < imageUrls.length - 1;
	const move = (direction: -1 | 1) => {
		const nextIndex = getAdjacentImageIndex(
			currentIndex,
			direction,
			imageUrls.length,
		);
		if (nextIndex === currentIndex) return;

		imageListRef.current?.scrollToOffset({
			offset: nextIndex * viewerWidth,
			animated: true,
		});
	};

	const handleViewerLayout = (event: LayoutChangeEvent) => {
		setViewerWidth(event.nativeEvent.layout.width);
	};

	const handlePageScrollEnd = (
		event: NativeSyntheticEvent<NativeScrollEvent>,
	) => {
		if (viewerWidth === 0) return;
		setCurrentIndex(
			clampImageIndex(
				Math.round(event.nativeEvent.contentOffset.x / viewerWidth),
				imageUrls.length,
			),
		);
	};

	return (
		<Modal
			visible={visible}
			animationType="fade"
			statusBarTranslucent
			navigationBarTranslucent
			onRequestClose={onClose}
		>
			<SafeAreaProvider>
				<StatusBar barStyle="light-content" backgroundColor={Colors.BLACK} />
				<GestureHandlerRootView style={styles.modalRoot}>
					<SafeAreaView
						edges={["top", "bottom", "left", "right"]}
						style={styles.safeArea}
					>
						<View style={styles.header}>
							<View style={styles.headerSpacer} />
							<Text style={styles.counter}>
								{currentIndex + 1} / {imageUrls.length}
							</Text>
							<Pressable
								accessibilityRole="button"
								accessibilityLabel="사진 닫기"
								style={({ pressed }) => [
									styles.iconButton,
									pressed && styles.buttonPressed,
								]}
								onPress={onClose}
							>
								<Icon name="close" size={ms(28)} color={Colors.WHITE} />
							</Pressable>
						</View>

						<View style={styles.viewer} onLayout={handleViewerLayout}>
							{viewerWidth > 0 && (
								<FlatList
									ref={imageListRef}
									data={imageUrls}
									horizontal
									pagingEnabled
									disableIntervalMomentum
									scrollEnabled={!isImageZoomed}
									showsHorizontalScrollIndicator={false}
									bounces={false}
									overScrollMode="never"
									keyExtractor={(url, index) => `${url}-${index}`}
									getItemLayout={(_data, index) => ({
										length: viewerWidth,
										offset: viewerWidth * index,
										index,
									})}
									onMomentumScrollEnd={handlePageScrollEnd}
									renderItem={({ item, index }) => (
										<View style={[styles.page, { width: viewerWidth }]}>
											<ZoomableImage
												url={item}
												accessibilityLabel={`${imageUrls.length}장 중 ${index + 1}번째 사진`}
												onZoomChange={setIsImageZoomed}
											/>
										</View>
									)}
								/>
							)}
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
									onPress={() => move(-1)}
								>
									<Icon
										name="chevron-left"
										size={ms(32)}
										color={Colors.WHITE}
									/>
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
									onPress={() => move(1)}
								>
									<Icon
										name="chevron-right"
										size={ms(32)}
										color={Colors.WHITE}
									/>
								</Pressable>
							</View>
						)}
					</SafeAreaView>
				</GestureHandlerRootView>
			</SafeAreaProvider>
		</Modal>
	);
};

export default ImageViewerModal;

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
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
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
		alignItems: "center",
		justifyContent: "center",
	},
	viewer: {
		flex: 1,
		overflow: "hidden",
	},
	page: {
		flex: 1,
	},
	controls: {
		minHeight: vs(64),
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: s(32),
		paddingHorizontal: s(16),
	},
	navigationButton: {
		width: ms(48),
		height: ms(48),
		borderRadius: ms(24),
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: Colors.BODYTEXT_MAIN,
	},
	buttonDisabled: {
		opacity: 0.3,
	},
	buttonPressed: {
		opacity: 0.6,
	},
});
