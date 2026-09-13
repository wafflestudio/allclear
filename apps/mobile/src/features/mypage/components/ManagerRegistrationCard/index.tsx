import { Pressable, StyleSheet, Text, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Colors } from "@/shared/constants/colors";
import { typography } from "@/shared/constants/typography";
import { ms, s, vs } from "@/shared/utils/scale";

type Props = { onPress?: () => void };

export const ManagerRegistrationCard = ({ onPress }: Props) => {
	const content = (
		<View style={styles.row}>
			<View>
				<Text style={styles.title}>동아리 운영진이신가요?</Text>
				<Text style={styles.subtitle}>신규 동아리 등록하기</Text>
			</View>
			<Icon name="chevron-right" color={Colors.POINTCOLOR} size={ms(20)} />
		</View>
	);
	return onPress ? (
		<Pressable
			style={({ pressed }) => [styles.card, pressed && styles.pressed]}
			onPress={onPress}
		>
			{content}
		</Pressable>
	) : (
		<View style={styles.card}>{content}</View>
	);
};

const styles = StyleSheet.create({
	card: {
		backgroundColor: "#FAFAFA",
		borderRadius: ms(12),
		paddingHorizontal: s(24),
		paddingVertical: vs(20),
	},
	row: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	title: {
		...typography.bodyMMedium,
		color: Colors.POINTCOLOR,
		letterSpacing: -0.02 * 14,
	},
	subtitle: {
		...typography.bodySRegular,
		color: Colors.POINTCOLOR,
		opacity: 0.4,
		marginTop: vs(4),
		letterSpacing: -0.02 * 12,
	},
	pressed: { opacity: 0.7 },
});
