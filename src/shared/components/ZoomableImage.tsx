import { Image, type LayoutChangeEvent, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from "react-native-reanimated";
import { clampImageScale, getPanTranslation } from "@/shared/utils/imageViewer";

type Props = {
	url: string;
	accessibilityLabel: string;
};

const DOUBLE_TAP_SCALE = 2;

const ZoomableImage = ({ url, accessibilityLabel }: Props) => {
	const viewportWidth = useSharedValue(0);
	const viewportHeight = useSharedValue(0);
	const scale = useSharedValue(1);
	const savedScale = useSharedValue(1);
	const translationX = useSharedValue(0);
	const translationY = useSharedValue(0);
	const savedTranslationX = useSharedValue(0);
	const savedTranslationY = useSharedValue(0);
	const pinchStartScale = useSharedValue(1);
	const panStartTranslationX = useSharedValue(0);
	const panStartTranslationY = useSharedValue(0);

	const handleLayout = (event: LayoutChangeEvent) => {
		viewportWidth.value = event.nativeEvent.layout.width;
		viewportHeight.value = event.nativeEvent.layout.height;
	};

	const resetZoom = () => {
		"worklet";
		scale.value = withTiming(1);
		savedScale.value = 1;
		translationX.value = withSpring(0);
		translationY.value = withSpring(0);
		savedTranslationX.value = 0;
		savedTranslationY.value = 0;
	};

	const pinchGesture = Gesture.Pinch()
		.onStart(() => {
			pinchStartScale.value = savedScale.value;
		})
		.onUpdate((event) => {
			scale.value = clampImageScale(pinchStartScale.value * event.scale);
		})
		.onEnd(() => {
			savedScale.value = scale.value;
			if (scale.value <= 1) {
				resetZoom();
				return;
			}

			const clampedTranslation = getPanTranslation({
				initialTranslation: {
					x: translationX.value,
					y: translationY.value,
				},
				gestureTranslation: { x: 0, y: 0 },
				scale: scale.value,
				viewport: {
					width: viewportWidth.value,
					height: viewportHeight.value,
				},
			});
			translationX.value = clampedTranslation.x;
			translationY.value = clampedTranslation.y;
			savedTranslationX.value = clampedTranslation.x;
			savedTranslationY.value = clampedTranslation.y;
		});

	const panGesture = Gesture.Pan()
		.averageTouches(true)
		.onStart(() => {
			panStartTranslationX.value = savedTranslationX.value;
			panStartTranslationY.value = savedTranslationY.value;
		})
		.onUpdate((event) => {
			if (scale.value <= 1) return;

			const nextTranslation = getPanTranslation({
				initialTranslation: {
					x: panStartTranslationX.value,
					y: panStartTranslationY.value,
				},
				gestureTranslation: {
					x: event.translationX,
					y: event.translationY,
				},
				scale: scale.value,
				viewport: {
					width: viewportWidth.value,
					height: viewportHeight.value,
				},
			});
			translationX.value = nextTranslation.x;
			translationY.value = nextTranslation.y;
		})
		.onEnd(() => {
			if (savedScale.value <= 1) {
				savedTranslationX.value = 0;
				savedTranslationY.value = 0;
				return;
			}

			savedTranslationX.value = translationX.value;
			savedTranslationY.value = translationY.value;
		});

	const doubleTapGesture = Gesture.Tap()
		.numberOfTaps(2)
		.onEnd((_event, success) => {
			if (!success) return;
			if (scale.value > 1) {
				resetZoom();
				return;
			}

			scale.value = withTiming(DOUBLE_TAP_SCALE);
			savedScale.value = DOUBLE_TAP_SCALE;
		});

	const gesture = Gesture.Race(
		doubleTapGesture,
		Gesture.Simultaneous(pinchGesture, panGesture),
	);
	const animatedStyle = useAnimatedStyle(() => ({
		transform: [
			{ translateX: translationX.value },
			{ translateY: translationY.value },
			{ scale: scale.value },
		],
	}));

	return (
		<GestureDetector gesture={gesture}>
			<Animated.View
				style={[styles.container, animatedStyle]}
				onLayout={handleLayout}
			>
				<Image
					source={{ uri: url }}
					style={styles.image}
					resizeMode="contain"
					accessibilityLabel={accessibilityLabel}
				/>
			</Animated.View>
		</GestureDetector>
	);
};

export default ZoomableImage;

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	image: {
		width: "100%",
		height: "100%",
	},
});
