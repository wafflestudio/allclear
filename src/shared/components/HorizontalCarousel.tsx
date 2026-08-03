import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";

import type { Club } from "@/entities/club";
import ClubPreviewCard from "@/shared/components/ClubPreviewCard";
import useAutoScroll from "@/shared/hooks/useAutoScroll";
import { s } from "@/shared/utils/scale";

export const HORIZONTAL_CAROUSEL_BOTTOM_PADDING = s(2);

type Props = {
	clubs: Club[];
	onPressClub: (club: Club) => void;
};

const HorizontalCarousel = ({ clubs, onPressClub }: Props) => {
	const { listRef, pauseAutoScroll, resumeAutoScroll, ...scrollEventProps } =
		useAutoScroll<Club>(clubs.length);

	const handleScrollBeginDrag = () => {
		pauseAutoScroll();
	};

	const handleScrollEndDrag = () => {
		resumeAutoScroll(350);
	};

	const handleMomentumScrollBegin = () => {
		pauseAutoScroll();
	};

	const handleMomentumScrollEnd = () => {
		resumeAutoScroll(450);
	};

	return (
		<View
			onTouchStart={pauseAutoScroll}
			onTouchEnd={() => resumeAutoScroll(300)}
			onTouchCancel={() => resumeAutoScroll(300)}
		>
			<Animated.FlatList
				ref={listRef}
				{...scrollEventProps}
				horizontal
				decelerationRate="normal"
				showsHorizontalScrollIndicator={false}
				style={styles.list}
				contentContainerStyle={styles.contentContainer}
				scrollEventThrottle={16}
				onScrollBeginDrag={handleScrollBeginDrag}
				onScrollEndDrag={handleScrollEndDrag}
				onMomentumScrollBegin={handleMomentumScrollBegin}
				onMomentumScrollEnd={handleMomentumScrollEnd}
				data={clubs}
				keyExtractor={(item) => item.id}
				ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
				renderItem={({ item }) => (
					<ClubPreviewCard
						title={item.name}
						description={item.description ?? ""}
						imageSource={{ uri: item.imageUri }}
						onPress={() => onPressClub(item)}
					/>
				)}
			/>
		</View>
	);
};

export default HorizontalCarousel;

const styles = StyleSheet.create({
	list: {
		width: "100%",
		overflow: "visible",
	},
	contentContainer: {
		paddingHorizontal: s(20),
		paddingBottom: HORIZONTAL_CAROUSEL_BOTTOM_PADDING,
	},
	itemSeparator: {
		width: 10,
	},
});
