import { useEffect, useRef } from "react";
import {
	Animated,
	Easing,
	type LayoutChangeEvent,
	type StyleProp,
	StyleSheet,
	Text,
	type ViewStyle,
} from "react-native";

import type { OfficialVerificationStatus } from "@/entities/club";
import { Colors } from "@/shared/constants/colors";
import { typography } from "@/shared/constants/typography";
import { s, vs } from "@/shared/utils/scale";

type Props = {
	status?: OfficialVerificationStatus;
	visible: boolean;
	style?: StyleProp<ViewStyle>;
	onLayout?: (event: LayoutChangeEvent) => void;
};

const VerificationOverlay = ({ status, visible, style, onLayout }: Props) => {
	const opacity = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		Animated.timing(opacity, {
			toValue: visible ? 1 : 0,
			duration: 300,
			easing: Easing.inOut(Easing.ease),
			useNativeDriver: true,
		}).start();
	}, [visible, opacity]);

	if (!status || status === "UNVERIFIED") return null;

	return (
		<Animated.View
			onLayout={onLayout}
			pointerEvents={visible ? "auto" : "none"}
			style={[styles.overlay, style, { opacity }]}
		>
			{status === "VERIFIED" ? (
				<Text style={styles.overlayText} numberOfLines={1}>
					{"서울대학교총동아리연합회 "}
					<Text style={styles.highlightText}>정등록 동아리</Text>
					{"에요!"}
				</Text>
			) : (
				<Text style={styles.overlayText} numberOfLines={1}>
					{"서울대학교총동아리연합회에서 "}
					<Text style={styles.highlightText}>아직 심사중</Text>
					{"이에요."}
				</Text>
			)}
		</Animated.View>
	);
};

export default VerificationOverlay;

const styles = StyleSheet.create({
	overlay: {
		position: "absolute",
		zIndex: 10,
		elevation: 10,
		paddingHorizontal: s(15),
		paddingVertical: vs(10),
		borderRadius: s(10),
		backgroundColor: Colors.BACKGROUND_SUB,
	},
	overlayText: {
		...typography.bodySMedium,
		color: Colors.BODYTEXT_SUB,
		textAlign: "center",
	},
	highlightText: {
		color: Colors.POINTCOLOR,
	},
});
