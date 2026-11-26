import {
	type StyleProp,
	StyleSheet,
	Text,
	View,
	type ViewStyle,
} from "react-native";
import { Colors } from "@/shared/constants/colors";
import { typography } from "@/shared/constants/typography";
import { s, vs } from "@/shared/utils/scale";

export type ClubApplicationOverlayStatus =
	| "reviewing"
	| "rejected"
	| "approved";

type Props = {
	status: ClubApplicationOverlayStatus;
	style?: StyleProp<ViewStyle>;
};

const getStatusView = (status: ClubApplicationOverlayStatus) => {
	switch (status) {
		case "rejected":
			return {
				badgeLabel: "반려",
				stageLabels: ["접수됨", "검토 중", "반려"],
				backgroundColor: "rgba(243, 110, 84, 0.2)",
				badgeColor: "#F36E54",
				isTerminal: true,
			};
		case "approved":
			return {
				badgeLabel: "승인",
				stageLabels: ["접수됨", "검토 중", "승인완료"],
				backgroundColor: Colors.POINTCOLOR_20,
				badgeColor: Colors.POINTCOLOR,
				isTerminal: true,
			};
		default:
			return {
				badgeLabel: "검토 중",
				stageLabels: ["접수됨", "검토 중", "결과 안내"],
				backgroundColor: Colors.POINTCOLOR_20,
				badgeColor: Colors.POINTCOLOR,
				isTerminal: false,
			};
	}
};

export const ClubApplicationStatusOverlay = ({ status, style }: Props) => {
	const statusView = getStatusView(status);

	return (
		<View
			accessibilityLabel={`신청 상태: ${statusView.badgeLabel}`}
			pointerEvents="none"
			style={[
				styles.overlay,
				{ backgroundColor: statusView.backgroundColor },
				style,
			]}
		>
			<View style={[styles.badge, { backgroundColor: statusView.badgeColor }]}>
				<Text
					style={[
						styles.badgeText,
						status === "approved" && styles.approvedBadgeText,
					]}
				>
					{statusView.badgeLabel}
				</Text>
			</View>

			<View style={styles.progress}>
				<View
					style={[styles.track, statusView.isTerminal && styles.terminalTrack]}
				>
					<View style={styles.completedTrack} />
				</View>
				<View style={styles.steps}>
					{statusView.stageLabels.map((label, index) => {
						const isCompleted = statusView.isTerminal || index <= 1;
						const isFinalStage = statusView.isTerminal && index === 2;

						return (
							<View key={label} style={styles.step}>
								<Text
									style={[
										styles.stepLabel,
										isCompleted && styles.completedStepLabel,
										isFinalStage && styles.finalStepLabel,
									]}
									numberOfLines={1}
								>
									{label}
								</Text>
								<View
									style={[
										styles.stepDot,
										isCompleted && styles.completedStepDot,
									]}
								/>
							</View>
						);
					})}
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	overlay: {
		width: "100%",
		height: vs(170),
		borderRadius: s(10),
		paddingHorizontal: s(21),
		paddingVertical: vs(19),
		alignItems: "flex-end",
		justifyContent: "space-between",
		overflow: "hidden",
	},
	badge: {
		minHeight: vs(37),
		paddingHorizontal: s(15),
		paddingVertical: vs(10),
		borderRadius: s(30),
		alignItems: "center",
		justifyContent: "center",
	},
	badgeText: {
		...typography.bodyMMedium,
		lineHeight: vs(17),
		color: Colors.WHITE,
		textAlign: "center",
	},
	approvedBadgeText: {
		...typography.bodyMSemibold,
		lineHeight: vs(17),
	},
	progress: {
		width: "100%",
		height: vs(39),
		justifyContent: "flex-start",
	},
	track: {
		position: "absolute",
		left: s(41),
		right: s(40),
		top: vs(30),
		height: vs(4),
		borderRadius: vs(2),
		backgroundColor: Colors.BADGE_UNSELECTED,
	},
	terminalTrack: {
		backgroundColor: Colors.POINTCOLOR,
	},
	completedTrack: {
		width: s(99),
		height: "100%",
		borderRadius: vs(2),
		backgroundColor: Colors.POINTCOLOR,
	},
	steps: {
		flexDirection: "row",
		gap: s(24),
	},
	step: {
		width: s(80),
		height: vs(39),
		alignItems: "center",
		gap: vs(8),
	},
	stepLabel: {
		...typography.bodySMedium,
		lineHeight: vs(17),
		letterSpacing: -0.24,
		color: Colors.BODYTEXT_SUB,
		textAlign: "center",
		width: "100%",
	},
	completedStepLabel: {
		color: Colors.POINTCOLOR,
	},
	finalStepLabel: {
		...typography.bodySSemibold,
		letterSpacing: 0,
	},
	stepDot: {
		width: s(14),
		height: s(14),
		borderRadius: s(7),
		backgroundColor: Colors.BADGE_UNSELECTED,
	},
	completedStepDot: {
		backgroundColor: Colors.POINTCOLOR,
	},
});
