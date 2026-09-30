import { useCallback, useEffect, useMemo, useState } from "react";
import {
	NativeModules,
	Platform,
	StatusBar,
	StyleSheet,
	View,
} from "react-native";
import Animated, {
	Easing,
	runOnJS,
	useReducedMotion,
	useSharedValue,
	withDelay,
	withSequence,
	withTiming,
} from "react-native-reanimated";
import EntryLoginActions from "@/shared/components/EntryLoginActions";
import { Colors } from "@/shared/constants/colors";
import { typography } from "@/shared/constants/typography";
import { useProfile } from "@/shared/contexts/profileContext";
import useEntrySplashAnimatedStyles from "@/shared/hooks/useEntrySplashAnimatedStyles";
import useEntrySplashViewport from "@/shared/hooks/useEntrySplashViewport";
import useLoginActions from "@/shared/hooks/useLoginActions";
import { isAndroidEntrySplashReady } from "@/shared/utils/androidEntrySplash";
import {
	ENTRY_SPLASH_HOLD_MS,
	ENTRY_SPLASH_TRANSITION_MS,
	getEntrySplashStages,
	shouldExitEntrySplash,
} from "@/shared/utils/entrySplash";

const FIGMA_EASE_OUT = Easing.bezier(0, 0, 0.58, 1);

const symbolSource =
	require("@/assets/images/brand/entry-symbol.png") as number;
const smallWordmarkSource =
	require("@/assets/images/brand/entry-wordmark-small.png") as number;
const transitionWordmarkSource =
	require("@/assets/images/brand/entry-wordmark-transition.png") as number;
const wordmarkSource =
	require("@/assets/images/brand/entry-wordmark.png") as number;

type Props = {
	active: boolean;
	onComplete: () => void;
};

const EntrySplashScreen = ({ active, onComplete }: Props) => {
	const { user, isLoading: isProfileLoading } = useProfile();
	const reduceMotion = useReducedMotion();
	const introProgress = useSharedValue(0);
	const loginProgress = useSharedValue(0);
	const screenOpacity = useSharedValue(1);
	const [brandRevealComplete, setBrandRevealComplete] = useState(false);
	const [loginReady, setLoginReady] = useState(false);
	const [guestEntryRequested, setGuestEntryRequested] = useState(false);
	const [finished, setFinished] = useState(false);
	const [laidOut, setLaidOut] = useState(false);
	const [settledAssets, setSettledAssets] = useState<string[]>([]);
	const [nativeSplashReleased, setNativeSplashReleased] = useState(
		Platform.OS !== "android",
	);
	const handleAssetSettled = useCallback((asset: string) => {
		setSettledAssets((assets) =>
			assets.includes(asset) ? assets : [...assets, asset],
		);
	}, []);
	const androidReady = isAndroidEntrySplashReady(laidOut, settledAssets);
	const { isLoading, onAppleButtonPress, onKakaoButtonPress } =
		useLoginActions();
	const isAuthenticated = Boolean(user);
	const shouldShowLogin = getEntrySplashStages(isAuthenticated).includes(4);
	const shouldExitSplash = shouldExitEntrySplash({
		isAuthenticated,
		guestEntryRequested,
	});
	const { contentTop, contentBottom, scaleX, scaleY, androidSymbolOrigin } =
		useEntrySplashViewport();
	const contentStyle = useMemo(
		() => ({
			top: contentTop,
			bottom: contentBottom,
		}),
		[contentBottom, contentTop],
	);

	const {
		screenStyle,
		smallWordmarkStyle,
		symbolStyle,
		taglineLayoutStyle,
		taglineStyle,
		transitionWordmarkStyle,
		visualProgress,
		wordmarkStyle,
	} = useEntrySplashAnimatedStyles({
		androidSymbolOrigin:
			Platform.OS === "android" ? androidSymbolOrigin : undefined,
		introProgress,
		loginProgress,
		scaleX,
		scaleY,
		screenOpacity,
	});
	const markBrandRevealComplete = useCallback(
		() => setBrandRevealComplete(true),
		[],
	);
	const markLoginReady = useCallback(() => setLoginReady(true), []);
	const handleGuestEntryPress = useCallback(
		() => setGuestEntryRequested(true),
		[],
	);
	const finishEntry = useCallback(() => {
		setFinished(true);
		onComplete();
	}, [onComplete]);

	useEffect(() => {
		if (
			Platform.OS !== "android" ||
			!active ||
			!androidReady ||
			nativeSplashReleased
		)
			return;
		const frame = requestAnimationFrame(() => {
			NativeModules.EntrySplash?.ready();
			setNativeSplashReleased(true);
		});
		return () => cancelAnimationFrame(frame);
	}, [active, androidReady, nativeSplashReleased]);

	useEffect(() => {
		if (!active || !nativeSplashReleased) return;

		if (reduceMotion) {
			introProgress.value = 2;
			setBrandRevealComplete(true);
			return;
		}

		introProgress.value = withSequence(
			withDelay(
				ENTRY_SPLASH_HOLD_MS,
				withTiming(1, {
					duration: ENTRY_SPLASH_TRANSITION_MS,
					easing: FIGMA_EASE_OUT,
				}),
			),
			withDelay(
				ENTRY_SPLASH_HOLD_MS,
				withTiming(
					2,
					{
						duration: ENTRY_SPLASH_TRANSITION_MS,
						easing: FIGMA_EASE_OUT,
					},
					(completed) => {
						if (completed) runOnJS(markBrandRevealComplete)();
					},
				),
			),
		);
	}, [
		active,
		introProgress,
		markBrandRevealComplete,
		nativeSplashReleased,
		reduceMotion,
	]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Login-state transitions intentionally re-evaluate the entry flow.
	useEffect(() => {
		if (!active || !brandRevealComplete || isProfileLoading || finished) return;

		if (shouldExitSplash) {
			const exitDelay =
				reduceMotion || loginReady || guestEntryRequested
					? 0
					: ENTRY_SPLASH_HOLD_MS;
			screenOpacity.value = withDelay(
				exitDelay,
				withTiming(
					0,
					{
						duration: reduceMotion ? 0 : ENTRY_SPLASH_TRANSITION_MS,
						easing: FIGMA_EASE_OUT,
					},
					(completed) => {
						if (completed) runOnJS(finishEntry)();
					},
				),
			);
			return;
		}

		if (loginReady) return;

		if (reduceMotion) {
			loginProgress.value = 1;
			markLoginReady();
			return;
		}

		loginProgress.value = withDelay(
			ENTRY_SPLASH_HOLD_MS,
			withTiming(
				1,
				{
					duration: ENTRY_SPLASH_TRANSITION_MS,
					easing: FIGMA_EASE_OUT,
				},
				(completed) => {
					if (completed) runOnJS(markLoginReady)();
				},
			),
		);
	}, [
		active,
		brandRevealComplete,
		finishEntry,
		finished,
		guestEntryRequested,
		isProfileLoading,
		loginReady,
		loginProgress,
		markLoginReady,
		reduceMotion,
		screenOpacity,
		shouldExitSplash,
		shouldShowLogin,
	]);

	return (
		<Animated.View
			style={[styles.screen, screenStyle]}
			onLayout={() => setLaidOut(true)}
		>
			<StatusBar barStyle="dark-content" backgroundColor={Colors.WHITE} />
			<View style={[styles.content, contentStyle]}>
				<Animated.Text
					style={[styles.tagline, taglineLayoutStyle, taglineStyle]}
				>
					이번 학기엔 동아리까지,
				</Animated.Text>
				<Animated.Image
					source={symbolSource}
					onLoadEnd={() => handleAssetSettled("symbol")}
					style={[styles.brandAsset, symbolStyle]}
				/>
				<Animated.Image
					source={smallWordmarkSource}
					onLoadEnd={() => handleAssetSettled("smallWordmark")}
					style={[styles.brandAsset, smallWordmarkStyle]}
				/>
				<Animated.Image
					source={transitionWordmarkSource}
					onLoadEnd={() => handleAssetSettled("transitionWordmark")}
					style={[styles.brandAsset, transitionWordmarkStyle]}
				/>
				<Animated.Image
					source={wordmarkSource}
					onLoadEnd={() => handleAssetSettled("wordmark")}
					style={[styles.brandAsset, wordmarkStyle]}
				/>

				<EntryLoginActions
					isLoading={isLoading}
					isReady={loginReady}
					onAppleButtonPress={onAppleButtonPress}
					onGuestEntryPress={handleGuestEntryPress}
					onKakaoButtonPress={onKakaoButtonPress}
					scaleX={scaleX}
					scaleY={scaleY}
					visualProgress={visualProgress}
				/>
			</View>
		</Animated.View>
	);
};

export default EntrySplashScreen;

const styles = StyleSheet.create({
	screen: {
		...StyleSheet.absoluteFillObject,
		zIndex: 100,
		backgroundColor: Colors.WHITE,
	},
	content: {
		position: "absolute",
		left: 0,
		right: 0,
	},
	brandAsset: {
		position: "absolute",
		resizeMode: "contain",
	},
	tagline: {
		position: "absolute",
		...typography.headerL,
		color: Colors.POINTCOLOR,
	},
});
