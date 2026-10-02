import { useQuery } from "@tanstack/react-query";
import { useContext } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Club } from "@/entities/club";
import ClubList from "@/features/club/components/ClubList/ClubList";
import { Colors } from "@/shared/constants/colors";
import { SCREEN_TYPE } from "@/shared/constants/screen";
import { typography } from "@/shared/constants/typography";
import { serviceContext } from "@/shared/contexts/serviceContext";
import WithViewEventLog from "@/shared/hocs/WithViewEventLog";
import { navigation } from "@/shared/utils/navigation";
import { s, vs } from "@/shared/utils/scale";

const SavedClubListScreen = () => {
	const { data: savedClubs, isLoading } = useSavedClubs();

	const openDetailPage = (club: Club) => {
		navigation.navigate(SCREEN_TYPE.CLUB_DETAIL, {
			uuid: club.uuid,
			category: club.category,
			entry_point: "saved_club_list",
		});
	};

	return (
		<WithViewEventLog
			params={{
				screen_name: "saved_club_list_screen",
			}}
		>
			<SafeAreaView
				edges={["top", "left", "right"]}
				style={{
					flex: 1,
					backgroundColor: Colors.BACKGROUND_MAIN,
					overflow: "scroll",
				}}
			>
				<View style={styles.headerContainer}>
					<Text style={styles.title}>내가 저장한 동아리</Text>
					{!isLoading && savedClubs ? (
						<Text style={styles.subtitle}>
							{savedClubs.totalSize}개의 동아리를 저장했어요!
						</Text>
					) : null}
				</View>
				<ClubList
					clubs={savedClubs?.clubs}
					openDetailPage={openDetailPage}
					emptyPlaceholder="저장한 동아리가 없어요"
					isLoading={isLoading}
				/>
			</SafeAreaView>
		</WithViewEventLog>
	);
};

export default SavedClubListScreen;

const styles = StyleSheet.create({
	headerContainer: {
		paddingHorizontal: s(20),
		paddingVertical: vs(10),
	},
	title: {
		...typography.headerXXL,
		color: Colors.BODYTEXT_MAIN,
		paddingTop: vs(10),
		paddingRight: s(12),
		paddingBottom: vs(10),
		paddingLeft: s(5),
	},
	subtitle: {
		...typography.bodyMSemibold,
		color: Colors.BODYTEXT_SUB,
		marginLeft: s(5),
	},
});

const useSavedClubs = () => {
	const { clubService } = useContext(serviceContext);

	return useQuery(["savedClubs"], () => clubService.listSavedClubs(), {
		staleTime: Infinity,
	});
};
