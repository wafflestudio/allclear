import { useMemo } from "react";
import {
	Extrapolation,
	interpolate,
	type SharedValue,
	useAnimatedStyle,
	useDerivedValue,
} from "react-native-reanimated";
import {
	ENTRY_SPLASH_SYMBOL_SIZE,
	getCenteredScaledAssetOrigin,
} from "@/shared/utils/entrySplash";

type Params = {
	contentTop: number;
	introProgress: SharedValue<number>;
	loginProgress: SharedValue<number>;
	nativeSplashLeft: number;
	nativeSplashTop: number;
	scaleX: number;
	scaleY: number;
	screenOpacity: SharedValue<number>;
};

const useEntrySplashAnimatedStyles = ({
	contentTop,
	introProgress,
	loginProgress,
	nativeSplashLeft,
	nativeSplashTop,
	scaleX,
	screenOpacity,
}: Params) => {
	const visualProgress = useDerivedValue(
		() => introProgress.value + loginProgress.value,
	);
	const nativeSplashContentTop = nativeSplashTop - contentTop;

	const taglineLayoutStyle = useMemo(
		() => ({
			fontFamily: "Pretendard-Bold",
			fontSize: 18 * scaleX,
			lineHeight: 30 * scaleX,
			letterSpacing: -0.36 * scaleX,
		}),
		[scaleX],
	);

	const screenStyle = useAnimatedStyle(() => ({
		opacity: screenOpacity.value,
	}));

	const symbolStyle = useAnimatedStyle(() => {
		const designLeft = interpolate(
			visualProgress.value,
			[0, 1, 2, 3],
			[
				nativeSplashLeft + 160.56,
				getCenteredScaledAssetOrigin({
					designOrigin: 111.03,
					designSize: 80.906,
					renderedSize: ENTRY_SPLASH_SYMBOL_SIZE,
					scale: scaleX,
				}),
				getCenteredScaledAssetOrigin({
					designOrigin: 79,
					designSize: 80.906,
					renderedSize: ENTRY_SPLASH_SYMBOL_SIZE,
					scale: scaleX,
				}),
				getCenteredScaledAssetOrigin({
					designOrigin: 78.59,
					designSize: 80.906,
					renderedSize: ENTRY_SPLASH_SYMBOL_SIZE,
					scale: scaleX,
				}),
			],
			Extrapolation.CLAMP,
		);
		const designTop = interpolate(
			visualProgress.value,
			[0, 1, 2, 3],
			[
				nativeSplashContentTop + 396.56,
				nativeSplashContentTop + 396.56,
				nativeSplashContentTop + 396.56,
				nativeSplashContentTop + 337.56,
			],
			Extrapolation.CLAMP,
		);

		return {
			left: designLeft,
			top: designTop,
			width: ENTRY_SPLASH_SYMBOL_SIZE,
			height: ENTRY_SPLASH_SYMBOL_SIZE,
		};
	});

	const taglineStyle = useAnimatedStyle(() => ({
		left: interpolate(
			visualProgress.value,
			[0, 1, 2, 3],
			[
				nativeSplashLeft + 111.56,
				79.44 * scaleX,
				79.44 * scaleX,
				79.03 * scaleX,
			],
			Extrapolation.CLAMP,
		),
		top: interpolate(
			visualProgress.value,
			[0, 1, 2, 3],
			[
				nativeSplashContentTop + 727,
				nativeSplashContentTop + 356.56,
				nativeSplashContentTop + 356.56,
				nativeSplashContentTop + 297.56,
			],
			Extrapolation.CLAMP,
		),
	}));

	const smallWordmarkStyle = useAnimatedStyle(() => ({
		left: interpolate(
			visualProgress.value,
			[0, 1],
			[nativeSplashLeft + 164.56, 194.03 * scaleX],
			Extrapolation.CLAMP,
		),
		top: interpolate(
			visualProgress.value,
			[0, 1],
			[nativeSplashContentTop + 767, nativeSplashContentTop + 406.5],
			Extrapolation.CLAMP,
		),
		width: interpolate(
			visualProgress.value,
			[0, 1],
			[72.5, 96.932 * scaleX],
			Extrapolation.CLAMP,
		),
		height: interpolate(
			visualProgress.value,
			[0, 1],
			[29.29, 59.489 * scaleX],
			Extrapolation.CLAMP,
		),
		opacity: interpolate(
			visualProgress.value,
			[0, 0.7, 1],
			[1, 1, 0],
			Extrapolation.CLAMP,
		),
	}));

	const transitionWordmarkStyle = useAnimatedStyle(() => ({
		left:
			interpolate(
				visualProgress.value,
				[1, 2],
				[194.03, 174.91],
				Extrapolation.CLAMP,
			) * scaleX,
		top: nativeSplashContentTop + 406.5,
		width: 96.932 * scaleX,
		height: 59.489 * scaleX,
		opacity: interpolate(
			visualProgress.value,
			[0.7, 1, 1.7, 2],
			[0, 1, 1, 0],
			Extrapolation.CLAMP,
		),
	}));

	const wordmarkStyle = useAnimatedStyle(() => ({
		left:
			interpolate(
				visualProgress.value,
				[2, 3],
				[174.91, 174.5],
				Extrapolation.CLAMP,
			) * scaleX,
		top: interpolate(
			visualProgress.value,
			[2, 3],
			[nativeSplashContentTop + 406.5, nativeSplashContentTop + 347.5],
			Extrapolation.CLAMP,
		),
		width: 147.222 * scaleX,
		height: 59.489 * scaleX,
		opacity: interpolate(
			visualProgress.value,
			[1.7, 2],
			[0, 1],
			Extrapolation.CLAMP,
		),
	}));

	return {
		screenStyle,
		smallWordmarkStyle,
		symbolStyle,
		taglineLayoutStyle,
		taglineStyle,
		transitionWordmarkStyle,
		visualProgress,
		wordmarkStyle,
	};
};

export default useEntrySplashAnimatedStyles;
