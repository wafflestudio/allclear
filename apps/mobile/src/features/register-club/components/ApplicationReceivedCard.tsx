import { Image, StyleSheet, Text, View } from "react-native";
import { Colors } from "@/shared/constants/colors";
import { typography } from "@/shared/constants/typography";
import { s, vs } from "@/shared/utils/scale";

const checkIcon =
	require("@/assets/icons/clubInfo/verification-mark.png") as number;
const steps = ["접수됨", "검토 중", "결과 안내"];

export const ApplicationReceivedCard = () => (
	<View style={styles.card}>
		<View style={styles.statusHeader}>
			<View style={styles.statusIcon}>
				<Image
					accessible={false}
					source={checkIcon}
					resizeMode="contain"
					style={styles.checkIcon}
				/>
			</View>
			<View style={styles.content}>
				<Text style={styles.title}>접수됨</Text>
				<Text style={styles.description}>
					신청이 정상적으로 접수되었어요.{"\n"}
					검토 후 결과를 안내해드릴게요.
				</Text>
			</View>
		</View>

		<View style={styles.progress}>
			<View style={styles.track}>
				<View style={styles.trackFill} />
			</View>
			<View style={styles.stepRow}>
				{steps.map((step, index) => (
					<View key={step} style={styles.step}>
						<View
							style={[styles.stepDot, index === 0 && styles.activeStepDot]}
						/>
						<Text
							style={[styles.stepLabel, index === 0 && styles.activeStepLabel]}
						>
							{step}
						</Text>
					</View>
				))}
			</View>
		</View>
	</View>
);

const styles = StyleSheet.create({
	card: {
		flexDirection: "column",
		alignItems: "stretch",
		gap: vs(16),
		backgroundColor: Colors.POINTCOLOR_10,
		borderRadius: s(15),
		paddingHorizontal: s(20),
		paddingVertical: vs(20),
	},
	statusHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: s(12),
	},
	statusIcon: {
		width: s(44),
		height: s(44),
		borderRadius: s(22),
		backgroundColor: Colors.WHITE,
		alignItems: "center",
		justifyContent: "center",
	},
	checkIcon: {
		width: s(20),
		height: s(20),
	},
	content: {
		flex: 1,
		gap: vs(8),
	},
	title: {
		...typography.headerXL,
		color: Colors.POINTCOLOR,
	},
	description: {
		...typography.bodyMRegular,
		color: Colors.BODYTEXT_SUB,
	},
	progress: {
		height: vs(40),
	},
	track: {
		position: "absolute",
		left: s(41),
		right: s(39),
		top: vs(5),
		height: vs(4),
		borderRadius: vs(2),
		backgroundColor: Colors.BADGE_UNSELECTED,
	},
	trackFill: {
		width: "27.4%",
		height: "100%",
		borderRadius: vs(2),
		backgroundColor: Colors.POINTCOLOR,
	},
	stepRow: {
		flex: 1,
		flexDirection: "row",
		gap: s(35),
	},
	step: {
		flex: 1,
		alignItems: "center",
		gap: vs(8),
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
	stepLabel: {
		...typography.bodySMedium,
		color: Colors.BODYTEXT_SUB,
		letterSpacing: -0.24,
	},
	activeStepLabel: {
		color: Colors.POINTCOLOR,
	},
});
