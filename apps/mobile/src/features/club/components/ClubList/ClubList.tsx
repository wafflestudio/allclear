import {
	Image,
	Pressable,
	StyleSheet,
	Text,
	useWindowDimensions,
	View,
} from "react-native";
import { FlatList } from "react-native-gesture-handler";
import type { Category } from "@/entities/category";
import type { Club } from "@/entities/club";
import { Colors } from "@/shared/constants/colors";
import { typography } from "@/shared/constants/typography";
import { s, vs } from "@/shared/utils/scale";
import ClubCard from "./ClubCard";
import ClubListSkeleton from "./ClubListSkeleton";

type Props = {
	clubs: Club[] | undefined;
	category?: Category["name"];
	openDetailPage: (club: Club) => void;
	emptyPlaceholder: string;
	emptyAction?: {
		label: string;
		onPress: () => void;
	};
	isLoading?: boolean;
};

const ClubList = ({
	clubs,
	category,
	openDetailPage,
	emptyPlaceholder,
	emptyAction,
	isLoading,
}: Props) => {
	const { width } = useWindowDimensions();
	const normalizedEmptyPlaceholder = emptyPlaceholder.replace(/\\n/g, "\n");

	if (isLoading) return <ClubListSkeleton />;
	if (!clubs) return null;
	if (clubs.length === 0) {
		return (
			<View style={styles.emptyContainer}>
				<Image
					source={require("@/assets/images/not-found.png")}
					style={styles.emptyImage}
				/>
				<Text style={styles.emptyText}>{normalizedEmptyPlaceholder}</Text>
				{emptyAction ? (
					<Pressable
						style={({ pressed }) => [
							styles.emptyActionButton,
							pressed && styles.emptyActionButtonPressed,
						]}
						onPress={emptyAction.onPress}
					>
						<Text style={styles.emptyActionText}>{emptyAction.label}</Text>
					</Pressable>
				) : null}
			</View>
		);
	}

	return (
		<FlatList
			keyExtractor={(item) => item.id}
			data={clubs}
			style={styles.list}
			contentContainerStyle={styles.listContent}
			renderItem={({ item }) => (
				<View style={{ width, paddingHorizontal: s(20) }}>
					<ClubCard
						club={item}
						category={category}
						onPress={() => openDetailPage(item)}
					/>
				</View>
			)}
			initialNumToRender={6}
			maxToRenderPerBatch={1}
			updateCellsBatchingPeriod={100}
			windowSize={7}
		/>
	);
};

const styles = StyleSheet.create({
	emptyContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	emptyImage: {
		width: s(122),
		height: s(99),
	},
	emptyText: {
		...typography.bodySRegular,
		textAlign: "center",
		marginTop: vs(20),
		color: Colors.BODYTEXT_MAIN,
	},
	emptyActionButton: {
		marginTop: vs(32),
		paddingHorizontal: s(20),
		paddingVertical: vs(15),
		borderRadius: s(20),
		backgroundColor: Colors.BUTTON_SELECTED,
	},
	emptyActionButtonPressed: {
		backgroundColor: Colors.BUTTON_PUSH,
	},
	emptyActionText: {
		...typography.bodyMSemibold,
		color: Colors.TEXT_BUTTON_SELECTED,
	},
	list: {
		flex: 1,
		width: "100%",
	},
	listContent: {
		gap: vs(25),
		paddingTop: vs(8),
		paddingBottom: vs(20),
	},
});

export default ClubList;
