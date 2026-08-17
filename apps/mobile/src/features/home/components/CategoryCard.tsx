import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
	Image,
	type ImageSourcePropType,
	Pressable,
	StyleSheet,
	Text,
} from "react-native";
import type { Category } from "@/entities/category";
import { Colors } from "@/shared/constants/colors";
import { SCREEN_TYPE, type StackParamList } from "@/shared/constants/screen";
import { typography } from "@/shared/constants/typography";
import useClickEventLog from "@/shared/hooks/useClickEventLog";
import { ms, s, vs } from "@/shared/utils/scale";

type NavigationProps = NativeStackNavigationProp<
	StackParamList,
	SCREEN_TYPE.HOME
>;

type Props = {
	category: Category;
	icon: ImageSourcePropType;
};

const CategoryCard = ({ category, icon }: Props) => {
	const { logClickEvent } = useClickEventLog();

	const navigation = useNavigation<NavigationProps>();

	const handleMoveToClubList = (categoryName: Category["name"]) => {
		logClickEvent({
			screen_name: "home_screen",
			screen_component_name: "category_card",
			category: categoryName,
		});

		navigation.navigate(SCREEN_TYPE.CLUB_LIST, { category: categoryName });
	};

	return (
		<Pressable
			onPress={() => handleMoveToClubList(category.name)}
			style={({ pressed }) => [
				styles.container,
				pressed && styles.containerPressed,
			]}
		>
			<Image style={styles.icon} source={icon} resizeMode="contain" />
			<Text style={styles.label}>{category.name}</Text>
		</Pressable>
	);
};
export default CategoryCard;

const styles = StyleSheet.create({
	container: {
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		width: s(70),
		height: s(70),
		borderRadius: ms(10),
		backgroundColor: Colors.WHITE,
	},
	containerPressed: {
		opacity: 0.6,
	},
	icon: {
		width: s(30),
		height: s(30),
		marginVertical: vs(5),
	},
	label: {
		...typography.bodySMedium,
		color: Colors.BODYTEXT_SUB,
	},
});
