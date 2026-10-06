import { useEffect } from "react";
import { Image, StyleSheet, View } from "react-native";
import Animated, {
	Easing,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withDelay,
	withRepeat,
	withSequence,
	withTiming,
} from "react-native-reanimated";

const yellowSymbolSource =
	require("@/assets/icons/typo-correction-spark.png") as number;
const greenCheckSource =
	require("@/assets/icons/typo-correction-check-badge.png") as number;

type YellowGreenMarkProps = {
	size?: number;
};

const YellowGreenMark = ({ size = 120 }: YellowGreenMarkProps) => {
	const badgeSize = size * (18 / 34);
	const reduceMotion = useReducedMotion();
	const rotation = useSharedValue(0);

	useEffect(() => {
		if (reduceMotion) {
			rotation.value = 0;
			return;
		}

		rotation.value = withRepeat(
			withSequence(
				withDelay(
					500,
					withTiming(100, { duration: 300, easing: Easing.out(Easing.ease) }),
				),
				withDelay(
					500,
					withTiming(-120, { duration: 300, easing: Easing.out(Easing.ease) }),
				),
				withDelay(
					500,
					withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) }),
				),
			),
			-1,
			false,
		);
	}, [reduceMotion, rotation]);

	const yellowSymbolStyle = useAnimatedStyle(() => ({
		transform: [{ rotate: `${rotation.value}deg` }],
	}));

	return (
		<View
			accessibilityLabel="완료 표시"
			style={[styles.container, { width: size, height: size }]}
		>
			<Animated.Image
				accessibilityIgnoresInvertColors
				source={yellowSymbolSource}
				style={[{ width: size, height: size }, yellowSymbolStyle]}
			/>
			<Image
				accessibilityIgnoresInvertColors
				source={greenCheckSource}
				style={[
					styles.badge,
					{
						width: badgeSize,
						height: badgeSize,
						left: size * 0.5,
						top: size * 0.6,
					},
				]}
			/>
		</View>
	);
};

export default YellowGreenMark;

const styles = StyleSheet.create({
	container: {
		position: "relative",
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
	},
	badge: {
		position: "absolute",
	},
});
