import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import VerificationMark from "@/features/club/components/VerificationMark";
import { Colors } from "@/shared/constants/colors";
import { typography } from "@/shared/constants/typography";
import { s, vs } from "@/shared/utils/scale";

type Props = {
	title: string;
	children: ReactNode;
};

export const NoticeCard = ({ title, children }: Props) => (
	<View style={styles.card}>
		<View style={styles.heading}>
			<VerificationMark status="VERIFIED" size={16} />
			<Text style={styles.title}>{title}</Text>
		</View>
		<Text style={styles.body}>{children}</Text>
	</View>
);

const styles = StyleSheet.create({
	card: {
		backgroundColor: "rgba(135, 79, 255, 0.2)",
		borderRadius: s(15),
		paddingHorizontal: s(20),
		paddingVertical: vs(16),
		gap: vs(8),
	},
	heading: {
		flexDirection: "row",
		alignItems: "center",
		gap: s(4),
	},
	title: {
		...typography.headerL,
		color: Colors.POINTCOLOR,
	},
	body: {
		...typography.bodyMRegular,
		color: Colors.BODYTEXT_SUB,
		lineHeight: vs(21),
	},
});
