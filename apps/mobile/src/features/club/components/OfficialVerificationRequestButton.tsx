import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import type { OfficialVerificationStatus } from "@/entities/club";
import { getOfficialVerificationButtonState } from "@/features/club/utils/officialVerificationRequest";
import { Colors } from "@/shared/constants/colors";
import { typography } from "@/shared/constants/typography";
import { ms, s, vs } from "@/shared/utils/scale";

type Props = {
	status?: OfficialVerificationStatus;
	isStatusLoading: boolean;
	isRequesting: boolean;
	isRetryLimitReached: boolean;
	isRetryLimitAcknowledged: boolean;
	onPress: () => void;
};

const pendingIndicatorSource =
	require("@/assets/icons/clubInfo/official-verification-pending-indicator.png") as number;
const completeIndicatorSource =
	require("@/assets/icons/clubInfo/official-verification-complete-indicator.png") as number;

const PENDING_INDICATOR_SIZE = 13.66;
const COMPLETE_INDICATOR_FRAME_WIDTH = 10;
const COMPLETE_INDICATOR_FRAME_HEIGHT = 6.667;
const COMPLETE_INDICATOR_HORIZONTAL_OVERFLOW = 1;
const COMPLETE_INDICATOR_VERTICAL_OVERFLOW = 1;

const OfficialVerificationRequestButton = ({
	status,
	isStatusLoading,
	isRequesting,
	isRetryLimitReached,
	isRetryLimitAcknowledged,
	onPress,
}: Props) => {
	const buttonState = getOfficialVerificationButtonState({
		status,
		isStatusLoading,
		isRequesting,
		isRetryLimitReached,
		isRetryLimitAcknowledged,
	});
	const isStatusButton = buttonState.variant === "status";
	const isFinalRejection = buttonState.variant === "final";
	const showPendingIndicator =
		status === "PENDING" || (isRequesting && !isFinalRejection);
	const showVerifiedIndicator = status === "VERIFIED";

	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={buttonState.label}
			accessibilityState={{
				disabled: buttonState.disabled,
				busy: isRequesting,
			}}
			disabled={buttonState.disabled}
			onPress={onPress}
			style={({ pressed }) => [
				styles.button,
				isStatusButton && styles.statusButton,
				isFinalRejection && styles.finalRejectionButton,
				pressed && !buttonState.disabled && styles.buttonPressed,
			]}
		>
			{({ pressed }) => (
				<View style={styles.content}>
					<Text
						style={[
							styles.label,
							isFinalRejection && styles.finalRejectionLabel,
							pressed && !buttonState.disabled && styles.labelPressed,
						]}
					>
						{buttonState.label}
					</Text>
					{showPendingIndicator ? (
						<Image
							source={pendingIndicatorSource}
							resizeMode="contain"
							style={styles.pendingIndicator}
						/>
					) : null}
					{showVerifiedIndicator ? (
						<View style={styles.completeIndicatorFrame}>
							<Image
								source={completeIndicatorSource}
								resizeMode="stretch"
								style={styles.completeIndicator}
							/>
						</View>
					) : null}
				</View>
			)}
		</Pressable>
	);
};

export default OfficialVerificationRequestButton;

const styles = StyleSheet.create({
	button: {
		width: "100%",
		height: vs(33),
		paddingHorizontal: s(10),
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: Colors.POINTCOLOR,
		borderRadius: ms(8),
		backgroundColor: Colors.WHITE,
	},
	statusButton: {
		backgroundColor: Colors.BACKGROUND_SUB,
	},
	finalRejectionButton: {
		borderWidth: 0,
		backgroundColor: Colors.BADGE_UNSELECTED,
	},
	buttonPressed: {
		borderColor: Colors.BUTTON_PUSH,
	},
	content: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: s(5),
	},
	pendingIndicator: {
		width: ms(PENDING_INDICATOR_SIZE),
		height: ms(PENDING_INDICATOR_SIZE),
	},
	completeIndicatorFrame: {
		width: ms(COMPLETE_INDICATOR_FRAME_WIDTH),
		height: ms(COMPLETE_INDICATOR_FRAME_HEIGHT),
	},
	completeIndicator: {
		position: "absolute",
		top: ms(-COMPLETE_INDICATOR_VERTICAL_OVERFLOW),
		left: ms(-COMPLETE_INDICATOR_HORIZONTAL_OVERFLOW),
		width: ms(
			COMPLETE_INDICATOR_FRAME_WIDTH +
				COMPLETE_INDICATOR_HORIZONTAL_OVERFLOW * 2,
		),
		height: ms(
			COMPLETE_INDICATOR_FRAME_HEIGHT +
				COMPLETE_INDICATOR_VERTICAL_OVERFLOW * 2,
		),
	},
	label: {
		...typography.bodyMSemibold,
		color: Colors.POINTCOLOR,
	},
	labelPressed: {
		color: Colors.BUTTON_PUSH,
	},
	finalRejectionLabel: {
		color: Colors.TEXTBOX_SELECTED,
	},
});
