import { Image, StyleSheet, Text, View } from "react-native";
import type { ManagedClubManagementStatus } from "@/entities/club";
import { Colors } from "@/shared/constants/colors";
import { typography } from "@/shared/constants/typography";
import { ms, s, vs } from "@/shared/utils/scale";

const verificationMark =
	require("@/assets/icons/clubInfo/verification-mark.png") as number;

type Props = {
	clubName: string;
	clubImageUri?: string | null;
	department: string;
	shortIntro: string;
	status: ManagedClubManagementStatus;
	showStatus?: boolean;
};

export const ClubManagementStatusCard = ({
	clubName,
	clubImageUri,
	department,
	shortIntro,
	status,
	showStatus = true,
}: Props) => {
	const isApproved = status === "APPROVED";
	const showStatusDetails = showStatus && !isApproved;
	const isRejected =
		status === "REJECTED" || status === "MANAGER_REQUEST_REJECTED";
	const statusColor = isRejected ? "#F36E54" : Colors.POINTCOLOR;
	const statusBackgroundColor = isRejected
		? "rgba(243, 110, 84, 0.2)"
		: Colors.POINTCOLOR_20;
	const lastStepLabel = isRejected
		? "반려"
		: status === "APPROVED"
			? "승인완료"
			: "결과 안내";
	const completed = isRejected || isApproved;

	return (
		<View
			accessibilityLabel={`${clubName}, ${isApproved ? "승인" : isRejected ? "반려" : "검토 중"}`}
			style={[
				styles.card,
				!showStatusDetails && styles.approvedCard,
				styles.cardBackground,
			]}
		>
			<View style={styles.clubInfo}>
				<View style={styles.thumbnail}>
					{clubImageUri ? (
						<Image
							source={{ uri: clubImageUri }}
							style={styles.thumbnailImage}
						/>
					) : null}
				</View>
				<View style={styles.clubTexts}>
					<View style={styles.clubNameRow}>
						<Text style={styles.clubName} numberOfLines={1}>
							{clubName}
						</Text>
						{isApproved && (
							<Image
								source={verificationMark}
								style={styles.verificationMark}
							/>
						)}
					</View>
					<Text style={styles.clubSubtext} numberOfLines={1}>
						{department}
					</Text>
					<Text style={styles.clubSubtext} numberOfLines={1}>
						{shortIntro}
					</Text>
				</View>
			</View>

			{showStatusDetails && (
				<>
					<View
						pointerEvents="none"
						style={[styles.tint, { backgroundColor: statusBackgroundColor }]}
					/>
					<View style={[styles.badge, { backgroundColor: statusColor }]}>
						<Text style={styles.badgeText}>
							{isRejected ? "반려" : "검토 중"}
						</Text>
					</View>
					<View style={styles.progress}>
						<View
							style={[
								styles.track,
								completed && { backgroundColor: Colors.POINTCOLOR },
							]}
						/>
						{!completed && <View style={styles.completedTrack} />}
						<View style={styles.steps}>
							{["접수됨", "검토 중", lastStepLabel].map((label, index) => {
								const isActive = completed || index < 2;
								const isFinal = completed && index === 2;

								return (
									<View key={label} style={styles.step}>
										<Text
											style={[
												styles.stepLabel,
												isActive && styles.activeStepLabel,
												isFinal && styles.finalStepLabel,
											]}
											numberOfLines={1}
										>
											{label}
										</Text>
										<View
											style={[styles.stepDot, isActive && styles.activeStepDot]}
										/>
									</View>
								);
							})}
						</View>
					</View>
				</>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	card: {
		width: s(330),
		height: vs(170),
		borderRadius: ms(10),
		paddingHorizontal: s(21),
		paddingVertical: vs(19),
		justifyContent: "space-between",
		overflow: "hidden",
	},
	approvedCard: {
		height: vs(120),
		justifyContent: "center",
	},
	cardBackground: {
		backgroundColor: Colors.BACKGROUND_MAIN,
	},
	tint: {
		...StyleSheet.absoluteFillObject,
	},
	clubInfo: {
		flexDirection: "row",
		alignItems: "center",
		gap: s(30),
		marginLeft: s(9),
	},
	thumbnail: {
		width: ms(75),
		height: ms(75),
		borderRadius: ms(10),
		backgroundColor: "#D9D9D9",
		overflow: "hidden",
		flexShrink: 0,
	},
	thumbnailImage: {
		width: "100%",
		height: "100%",
	},
	clubTexts: {
		width: s(150),
		gap: vs(5),
	},
	clubName: {
		fontFamily: "Pretendard",
		fontWeight: "700",
		fontSize: ms(17),
		lineHeight: ms(24),
		letterSpacing: -0.34,
		color: Colors.BODYTEXT_MAIN,
	},
	clubNameRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: s(4),
	},
	verificationMark: {
		width: s(16),
		height: s(16),
		resizeMode: "contain",
	},
	clubSubtext: {
		fontFamily: "Pretendard",
		fontWeight: "400",
		fontSize: ms(13),
		lineHeight: ms(15),
		letterSpacing: -0.26,
		color: Colors.BODYTEXT_SUB,
	},
	badge: {
		position: "absolute",
		top: vs(19),
		right: s(21),
		minHeight: vs(37),
		paddingHorizontal: s(15),
		paddingVertical: vs(10),
		borderRadius: ms(30),
		alignItems: "center",
		justifyContent: "center",
	},
	badgeText: {
		...typography.bodyMMedium,
		lineHeight: vs(17),
		color: Colors.WHITE,
	},
	progress: {
		width: "100%",
		height: vs(39),
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
	completedTrack: {
		position: "absolute",
		left: s(41),
		top: vs(30),
		width: s(99),
		height: vs(4),
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
	activeStepLabel: {
		color: Colors.POINTCOLOR,
	},
	finalStepLabel: {
		fontWeight: "600",
		letterSpacing: 0,
	},
	stepDot: {
		width: s(14),
		height: s(14),
		borderRadius: s(7),
		backgroundColor: Colors.BADGE_UNSELECTED,
	},
	activeStepDot: {
		backgroundColor: Colors.POINTCOLOR,
	},
});
