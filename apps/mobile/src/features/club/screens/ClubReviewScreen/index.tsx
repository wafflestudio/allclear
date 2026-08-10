import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useContext, useEffect } from "react";
import {
	ActivityIndicator,
	Dimensions,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import type { Club } from "@/entities/club";
import type { ReviewKeyword } from "@/entities/review";
import BackgroundCard from "@/features/club/components/ClubDetail/BackgroundCard";
import BackHeader from "@/shared/components/BackHeader";
import { Button } from "@/shared/components/Button";
import { Colors } from "@/shared/constants/colors";
import type { SCREEN_TYPE, StackParamList } from "@/shared/constants/screen";
import { typography } from "@/shared/constants/typography";
import { serviceContext } from "@/shared/contexts/serviceContext";
import WithViewEventLog from "@/shared/hocs/WithViewEventLog";
import useClickEventLog from "@/shared/hooks/useClickEventLog";
import { navigation } from "@/shared/utils/navigation";
import { ms, s, vs } from "@/shared/utils/scale";

type DetailsScreenRouteProp = RouteProp<
	StackParamList,
	SCREEN_TYPE.CLUB_REVIEW
>;
type DetailsScreenNavigationProp = NativeStackNavigationProp<
	StackParamList,
	SCREEN_TYPE.CLUB_REVIEW
>;

type Props = {
	route: DetailsScreenRouteProp;
	navigation: DetailsScreenNavigationProp;
};

const deviceHeight = Dimensions.get("window").height;

const ClubReviewScreen = ({ route }: Props) => {
	const { uuid, category } = route.params;
	const [selectedKeywordIds, setSelectedKeywordIds] = React.useState<
		ReviewKeyword["id"][]
	>([]);

	const { data: reviewKeywordCategories } = useReviewKeywordCategories();
	const { data: club, isLoading } = useClub({ uuid });
	const { data: myClubReviewIds } = useMyClubReview({ uuid });
	const { mutate, isLoading: isSubmitting } = useCreateClubReview({
		uuid,
		reviewKeywordIds: selectedKeywordIds,
	});
	const { logClickEvent } = useClickEventLog();

	useEffect(() => {
		if (!myClubReviewIds) return;

		setSelectedKeywordIds(myClubReviewIds);
	}, [myClubReviewIds]);

	const handleBackButton = () => navigation.goBack();
	const handleKeywordPress = (keywordId: ReviewKeyword["id"]) => {
		setSelectedKeywordIds((currentIds) =>
			currentIds.includes(keywordId)
				? currentIds.filter((id) => id !== keywordId)
				: [...currentIds, keywordId],
		);
	};

	const handleSaveReview = async () => {
		logClickEvent({
			screen_name: "club_review_screen",
			screen_component_name: "save_review_button",
		});

		mutate();
	};

	if (!category || !club) return null;

	const isSubmitDisabled = isSubmitting || selectedKeywordIds.length === 0;

	return (
		<WithViewEventLog
			params={{
				screen_name: "club_review_screen",
				category,
				club_name: club?.name ?? "",
				entry_point: "club_detail",
			}}
		>
			<SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
				<BackHeader title="활동 후기 남기기" onBack={handleBackButton} />
				{isLoading && (
					<View style={{ height: deviceHeight }}>
						<ActivityIndicator
							size="large"
							color={Colors.POINTCOLOR}
							style={{ marginTop: deviceHeight * 0.3 }}
						/>
					</View>
				)}
				{club && (
					<ScrollView
						style={styles.scrollView}
						contentContainerStyle={styles.scrollContent}
					>
						<BackgroundCard style={styles.reviewCard}>
							<View style={styles.reviewHeader}>
								<Text style={styles.title}>
									<Text style={styles.clubName}>{club.name}</Text>
									{" 에서의 경험을 공유해주세요"}
								</Text>
								<Text style={styles.participantCount}>
									현재까지 {club.totalReviews}명이 참여했어요
								</Text>
							</View>

							<View style={styles.categoryList}>
								{reviewKeywordCategories?.map((kc) => {
									const columnBreak = Math.ceil(kc.keywords.length / 2);
									const keywordColumns = [
										kc.keywords.slice(0, columnBreak),
										kc.keywords.slice(columnBreak),
									].filter((column) => column.length > 0);

									return (
										<View key={kc.id}>
											<Text style={styles.categoryTitle}>{kc.title}</Text>
											<View style={styles.keywordContainer}>
												{keywordColumns.map((column) => (
													<View key={column[0].id} style={styles.keywordColumn}>
														{column.map((keyword) => {
															const isSelected = selectedKeywordIds.includes(
																keyword.id,
															);

															return (
																<TouchableOpacity
																	key={keyword.id}
																	accessibilityRole="checkbox"
																	accessibilityState={{ checked: isSelected }}
																	style={[
																		styles.keyword,
																		isSelected && styles.keywordSelected,
																	]}
																	onPress={() => handleKeywordPress(keyword.id)}
																>
																	<Text style={styles.keywordIcon}>
																		{keyword.iconUri?.trim()}
																	</Text>
																	<Text
																		style={[
																			styles.keywordTitle,
																			isSelected && styles.keywordTitleSelected,
																		]}
																	>
																		{keyword.title}
																	</Text>
																</TouchableOpacity>
															);
														})}
													</View>
												))}
											</View>
										</View>
									);
								})}
							</View>
						</BackgroundCard>

						<View style={styles.submitWrapper}>
							<Button
								label="저장하기"
								onPress={handleSaveReview}
								variant="primary"
								disabled={isSubmitDisabled}
								height={vs(35)}
								width={s(164)}
								style={[
									styles.submitButton,
									isSubmitDisabled && styles.submitButtonDisabled,
								]}
								textStyle={styles.submitButtonText}
							/>
						</View>
					</ScrollView>
				)}
			</SafeAreaView>
		</WithViewEventLog>
	);
};

export default ClubReviewScreen;

type UseClubProps = {
	uuid: Club["uuid"];
};

const useClub = ({ uuid }: UseClubProps) => {
	const { clubService } = useContext(serviceContext);

	const query = useQuery(["clubs", uuid], () => clubService.getClub({ uuid }));

	return query;
};

const useReviewKeywordCategories = () => {
	const { reviewService } = useContext(serviceContext);

	return useQuery(
		["reviewKeywords"],
		() => reviewService.listReviewKeywords(),
		{
			select: (data) => data.categories,
		},
	);
};

const useMyClubReview = ({ uuid }: { uuid: Club["uuid"] }) => {
	const { reviewService } = useContext(serviceContext);

	return useQuery(
		["myClubReview", uuid],
		() => reviewService.getMyClubReview({ uuid }),
		{
			select: (data) => data?.reviewKeywordIds,
		},
	);
};

const useCreateClubReview = ({
	uuid,
	reviewKeywordIds,
}: {
	uuid: Club["uuid"];
	reviewKeywordIds: ReviewKeyword["id"][];
}) => {
	const queryClient = useQueryClient();
	const { reviewService } = useContext(serviceContext);

	return useMutation(
		() => reviewService.createClubReviews({ uuid, reviewKeywordIds }),
		{
			onSuccess: () => {
				Toast.show({
					type: "info",
					position: "bottom",
					text1: "🎉  리뷰가 저장되었어요",
				});
				queryClient.invalidateQueries();
				navigation.goBack();
			},
		},
	);
};

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: Colors.BACKGROUND_MAIN,
	},
	scrollView: {
		paddingHorizontal: s(15),
	},
	scrollContent: {
		paddingTop: vs(13),
		paddingBottom: vs(24),
	},
	reviewCard: {
		padding: s(20),
		borderRadius: ms(15),
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 5,
	},
	reviewHeader: {
		gap: vs(3),
		marginBottom: vs(25),
	},
	title: {
		...typography.headerL,
		color: Colors.BODYTEXT_SUB,
	},
	clubName: {
		color: Colors.POINTCOLOR,
	},
	participantCount: {
		...typography.bodySSmallMedium,
		color: Colors.BODYTEXT_SUB,
	},
	categoryList: { gap: vs(25) },
	categoryTitle: {
		...typography.bodyMMedium,
		color: Colors.BODYTEXT_SUB,
		marginBottom: vs(10),
	},
	keywordContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
	},
	keywordColumn: { alignItems: "flex-start", gap: vs(8) },
	keyword: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingTop: vs(7),
		paddingBottom: vs(8),
		paddingHorizontal: s(10),
		borderRadius: ms(20),
		borderWidth: 0.3,
		borderColor: Colors.POINTCOLOR,
		backgroundColor: Colors.WHITE,
	},
	keywordSelected: {
		backgroundColor: Colors.POINTCOLOR,
		borderColor: Colors.POINTCOLOR,
	},
	keywordIcon: {
		...typography.bodySRegular,
		lineHeight: vs(12),
		marginRight: s(2),
	},
	keywordTitle: {
		...typography.bodySRegular,
		color: Colors.BODYTEXT_SUB,
		lineHeight: vs(12),
	},
	keywordTitleSelected: {
		color: Colors.WHITE,
	},
	submitWrapper: {
		flexDirection: "row",
		justifyContent: "center",
		marginTop: vs(28),
	},
	submitButton: { paddingVertical: 0, borderRadius: ms(8) },
	submitButtonDisabled: { backgroundColor: Colors.BODYTEXT_DISABLED },
	submitButtonText: { ...typography.bodyMSemibold, color: Colors.WHITE },
});
