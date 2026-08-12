import { Image, StyleSheet, Text, View } from "react-native";
import CategoryCard from "@/features/home/components/CategoryCard";
import { CategoryMap } from "@/shared/constants/category";
import { Colors } from "@/shared/constants/colors";
import { typography } from "@/shared/constants/typography";
import { ms, s, vs } from "@/shared/utils/scale";

const categoryList = Object.values(CategoryMap);

const CategorySection = () => (
	<View style={styles.container}>
		<View style={styles.topRow}>
			<View style={styles.titleContainer}>
				<Image
					source={require("@/assets/icons/category-title.png")}
					style={styles.titleIcon}
				/>
				<View style={styles.titleWrapper}>
					<Text style={styles.subtitle}>원하는 활동이 있으신가요?</Text>
					<Text style={styles.title}>
						<Text style={styles.titleAccent}>카테고리 </Text>모아보기
					</Text>
				</View>
			</View>
			<CategoryCard
				category={{ name: categoryList[0].name }}
				icon={categoryList[0].icon}
			/>
		</View>
		<View style={styles.grid}>
			{categoryList.slice(1).map(({ name, icon }) => (
				<CategoryCard key={name} category={{ name }} icon={icon} />
			))}
		</View>
	</View>
);

export default CategorySection;

const styles = StyleSheet.create({
	container: {
		width: s(353),
		height: vs(277),
		borderRadius: ms(16),
		backgroundColor: Colors.BACKGROUND_SUB,
		paddingHorizontal: s(24),
		paddingVertical: vs(20),
		justifyContent: "center",
		shadowColor: Colors.BLACK,
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.12,
		shadowRadius: 4,
		elevation: 3,
	},
	titleContainer: {
		flexDirection: "row",
		alignItems: "center",
		flexShrink: 1,
	},
	titleWrapper: {
		flexDirection: "column",
		justifyContent: "center",
	},
	topRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: vs(12),
	},
	titleIcon: {
		width: s(47),
		height: s(46),
		marginHorizontal: s(8),
	},
	subtitle: {
		...typography.bodySRegular,
		color: Colors.BODYTEXT_SUB,
	},
	title: {
		...typography.headerXL,
		color: Colors.BODYTEXT_MAIN,
	},
	titleAccent: {
		color: Colors.POINTCOLOR,
	},
	grid: {
		flexDirection: "row",
		flexWrap: "wrap",
		columnGap: s(8),
		rowGap: vs(12),
	},
});
