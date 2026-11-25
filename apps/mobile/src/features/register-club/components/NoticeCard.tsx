import type { ReactNode } from "react";
import {
	type StyleProp,
	StyleSheet,
	Text,
	View,
	type ViewStyle,
} from "react-native";
import VerificationMark from "@/features/club/components/VerificationMark";
import { Colors } from "@/shared/constants/colors";
import { typography } from "@/shared/constants/typography";
import { s, vs } from "@/shared/utils/scale";

type Props = {
	title?: string;
	children: ReactNode;
	footer?: ReactNode;
	style?: StyleProp<ViewStyle>;
};

export const NoticeCard = ({ title, children, footer, style }: Props) => (
	<View style={[styles.card, style]}>
		{title ? (
			<View style={styles.heading}>
				<VerificationMark status="VERIFIED" size={16} />
				<Text style={styles.title}>{title}</Text>
			</View>
		) : null}
		<Text style={styles.body}>{children}</Text>
		{footer ? <View style={styles.footer}>{footer}</View> : null}
	</View>
);

const styles = StyleSheet.create({
	card: {
		backgroundColor: Colors.POINTCOLOR_10,
		borderRadius: s(12),
		padding: s(16),
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
	footer: {
		marginTop: vs(2),
	},
});
