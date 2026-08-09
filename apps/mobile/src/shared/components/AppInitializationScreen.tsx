import { useMemo } from "react";
import { Image, StatusBar, StyleSheet, Text, View } from "react-native";
import { Colors } from "@/shared/constants/colors";
import useEntrySplashViewport from "@/shared/hooks/useEntrySplashViewport";
import {
	ENTRY_SPLASH_SYMBOL_SIZE,
	getCenteredScaledAssetOrigin,
} from "@/shared/utils/entrySplash";

const symbolSource =
	require("@/assets/images/brand/entry-symbol-white.png") as number;
const wordmarkSource =
	require("@/assets/images/brand/entry-wordmark-small.png") as number;

const AppInitializationScreen = () => {
	const { contentTop, contentBottom, scaleX, scaleY } =
		useEntrySplashViewport();

	const layoutStyles = useMemo(
		() => ({
			content: {
				top: contentTop,
				bottom: contentBottom,
			},
			symbol: {
				left: getCenteredScaledAssetOrigin({
					designOrigin: 160.556,
					designSize: 80.906,
					renderedSize: ENTRY_SPLASH_SYMBOL_SIZE,
					scale: scaleX,
				}),
				top: getCenteredScaledAssetOrigin({
					designOrigin: 396.562,
					designSize: 80.876,
					renderedSize: ENTRY_SPLASH_SYMBOL_SIZE,
					scale: scaleY,
				}),
				width: ENTRY_SPLASH_SYMBOL_SIZE,
				height: ENTRY_SPLASH_SYMBOL_SIZE,
			},
			tagline: {
				left: 117.556 * scaleX,
				top: 739 * scaleY,
				fontFamily: "Pretendard-Bold",
				fontSize: 18 * scaleX,
				lineHeight: 30 * scaleX,
				letterSpacing: -0.36 * scaleX,
			},
			wordmark: {
				left: 164.556 * scaleX,
				top: 779 * scaleY,
				width: 72.497 * scaleX,
				height: 29.294 * scaleX,
			},
		}),
		[contentBottom, contentTop, scaleX, scaleY],
	);

	return (
		<View
			accessible
			accessibilityRole="progressbar"
			accessibilityLabel="앱을 준비하고 있습니다"
			style={styles.screen}
		>
			<StatusBar barStyle="light-content" backgroundColor={Colors.POINTCOLOR} />
			<View style={[styles.content, layoutStyles.content]}>
				<Image
					source={symbolSource}
					style={[styles.asset, layoutStyles.symbol]}
				/>
				<Text style={[styles.tagline, layoutStyles.tagline]}>
					이번 학기엔 동아리까지,
				</Text>
				<Image
					source={wordmarkSource}
					style={[styles.asset, styles.wordmark, layoutStyles.wordmark]}
				/>
			</View>
		</View>
	);
};

export default AppInitializationScreen;

const styles = StyleSheet.create({
	screen: {
		...StyleSheet.absoluteFillObject,
		zIndex: 100,
		backgroundColor: Colors.POINTCOLOR,
	},
	content: {
		position: "absolute",
		left: 0,
		right: 0,
	},
	asset: {
		position: "absolute",
		resizeMode: "contain",
	},
	tagline: {
		position: "absolute",
		color: Colors.WHITE,
	},
	wordmark: {
		tintColor: Colors.WHITE,
	},
});
