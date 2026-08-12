import { StyleSheet, Text, View } from "react-native";

import { Colors } from "@/shared/constants/colors";
import { typography } from "@/shared/constants/typography";
import { ms, s } from "@/shared/utils/scale";

type Props = {
	keyword: { iconUri: string; title: string };
	themeColor: string;
	backgroundColor: string;
};

const ReviewKeywordPill = ({ keyword, themeColor, backgroundColor }: Props) => {
	return (
		<View style={[styles.pill, { borderColor: themeColor, backgroundColor }]}>
			<Text style={[styles.text, styles.icon]}>{keyword.iconUri?.trim()}</Text>
			<Text style={[styles.title, styles.text]} numberOfLines={1}>
				{keyword.title}
			</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	pill: {
		flexDirection: "row",
		alignItems: "center",
		borderRadius: ms(24),
		borderWidth: 0.5,
		flexShrink: 1,
		minHeight: ms(21),
		paddingHorizontal: s(6),
		paddingTop: ms(5),
		paddingBottom: ms(6),
	},
	text: {
		...typography.bodyXSRegular,
		lineHeight: ms(10),
	},
	icon: {
		fontSize: ms(8.5),
		marginRight: s(4),
	},
	title: {
		color: Colors.BODYTEXT_SUB,
		flexShrink: 1,
	},
});

export default ReviewKeywordPill;
