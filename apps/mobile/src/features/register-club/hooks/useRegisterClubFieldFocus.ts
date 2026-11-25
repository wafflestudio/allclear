import { useEffect, useRef } from "react";
import { Animated, Easing, type ScrollView } from "react-native";
import type { RegisterClubFocusTarget } from "@/features/register-club/types/focus";
import { Colors } from "@/shared/constants/colors";
import { vs } from "@/shared/utils/scale";

type Options = {
	focusTarget?: RegisterClubFocusTarget;
	target: RegisterClubFocusTarget;
	y: number | null;
	scrollViewRef: React.RefObject<ScrollView | null>;
};

export const useRegisterClubFieldFocus = ({
	focusTarget,
	target,
	y,
	scrollViewRef,
}: Options) => {
	const animationValue = useRef(new Animated.Value(0)).current;
	const hasHandledFocus = useRef(false);
	const frameRef = useRef<number | null>(null);
	const animationRef = useRef<Animated.CompositeAnimation | null>(null);
	const highlightColor = animationValue.interpolate({
		inputRange: [0, 1],
		outputRange: ["rgba(231, 220, 255, 0)", Colors.POINTCOLOR_10],
	});

	useEffect(() => {
		if (focusTarget !== target) {
			hasHandledFocus.current = false;
			if (frameRef.current !== null) {
				cancelAnimationFrame(frameRef.current);
				frameRef.current = null;
			}
			animationRef.current?.stop();
			animationValue.setValue(0);
			return;
		}
		if (y === null || hasHandledFocus.current) return;

		hasHandledFocus.current = true;
		frameRef.current = requestAnimationFrame(() => {
			scrollViewRef.current?.scrollTo({
				y: Math.max(0, y - vs(24)),
				animated: true,
			});
			animationRef.current = Animated.sequence([
				Animated.timing(animationValue, {
					toValue: 1,
					duration: 220,
					easing: Easing.out(Easing.quad),
					useNativeDriver: false,
				}),
				Animated.delay(420),
				Animated.timing(animationValue, {
					toValue: 0,
					duration: 520,
					easing: Easing.inOut(Easing.quad),
					useNativeDriver: false,
				}),
			]);
			animationRef.current.start();
		});
	}, [animationValue, focusTarget, scrollViewRef, target, y]);

	useEffect(
		() => () => {
			if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
			animationRef.current?.stop();
		},
		[],
	);

	return highlightColor;
};
