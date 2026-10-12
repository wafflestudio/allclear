import { Pressable, StyleSheet, Text, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Colors } from "@/shared/constants/colors";
import { ms, s, vs } from "@/shared/utils/scale";

type Props = {
	onPress?: () => void;
};

export const NewAnnouncementAction = ({ onPress }: Props) => {
	const content = (
		<>
			<Text style={styles.text}>새 공고 작성하기</Text>
			<Icon name="edit" size={ms(16)} color={Colors.POINTCOLOR} />
		</>
	);

	if (!onPress) return <View style={styles.row}>{content}</View>;

	return (
		<Pressable
			style={({ pressed }) => [styles.row, pressed && styles.pressed]}
			onPress={onPress}
		>
			{content}
		</Pressable>
	);
};

const styles = StyleSheet.create({
	row: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: vs(10),
		paddingHorizontal: s(15),
		borderRadius: ms(12),
		minHeight: vs(34),
		backgroundColor: Colors.WHITE,
		borderWidth: 1,
		borderColor: Colors.POINTCOLOR,
	},
	text: {
		fontFamily: "Pretendard",
		fontWeight: "500",
		fontSize: ms(12),
		lineHeight: ms(14),
		letterSpacing: -0.02 * 12,
		color: Colors.POINTCOLOR,
	},
	pressed: { opacity: 0.6 },
});
