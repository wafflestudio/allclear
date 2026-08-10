import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { useContext, useState } from "react";
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import BackgroundCard from "@/features/club/components/ClubDetail/BackgroundCard";
import RecruitmentDetailCard from "@/features/club/components/ClubDetail/RecruitmentDetailCard";
import { getNextExpandedRecruitmentId } from "@/features/club/utils/recruitmentPresentation";
import type { RecruitmentSummary } from "@/repositories/recruitment";
import BackHeader from "@/shared/components/BackHeader";
import { Colors } from "@/shared/constants/colors";
import type { SCREEN_TYPE, StackParamList } from "@/shared/constants/screen";
import { typography } from "@/shared/constants/typography";
import { useProfile } from "@/shared/contexts/profileContext";
import { serviceContext } from "@/shared/contexts/serviceContext";
import useRequireLogin from "@/shared/hooks/useRequireLogin";
import { ms, s, vs } from "@/shared/utils/scale";

type ScreenRoute = RouteProp<StackParamList, SCREEN_TYPE.PREVIOUS_RECRUITMENTS>;
type ScreenNavigation = NativeStackNavigationProp<
	StackParamList,
	SCREEN_TYPE.PREVIOUS_RECRUITMENTS
>;

type Props = {
	route: ScreenRoute;
	navigation: ScreenNavigation;
};

const PreviousRecruitmentItem = ({
	recruitment,
	isExpanded,
	onPress,
}: {
	recruitment: RecruitmentSummary;
	isExpanded: boolean;
	onPress: () => void;
}) => {
	const { recruitmentService } = useContext(serviceContext);
	const detailQuery = useQuery(
		["recruitmentDetail", recruitment.id],
		() =>
			recruitmentService.getRecruitmentDetail({
				recruitmentId: recruitment.id,
			}),
		{ enabled: isExpanded },
	);

	return (
		<BackgroundCard style={styles.itemCard}>
			<Pressable
				accessibilityRole="button"
				accessibilityState={{ expanded: isExpanded }}
				style={styles.itemHeader}
				onPress={onPress}
			>
				<View style={styles.itemTitleWrapper}>
					<Text
						style={[styles.itemTitle, isExpanded && styles.itemTitleExpanded]}
					>
						{recruitment.display_title}
					</Text>
					<Text style={styles.itemSubtitle} numberOfLines={1}>
						{recruitment.title}
					</Text>
				</View>
				<Icon
					name={isExpanded ? "chevron-up" : "chevron-down"}
					size={ms(24)}
					color={isExpanded ? Colors.POINTCOLOR : Colors.BODYTEXT_SUB}
				/>
			</Pressable>

			{isExpanded && (
				<View style={styles.expandedContent}>
					{detailQuery.isLoading ? (
						<ActivityIndicator color={Colors.POINTCOLOR} />
					) : detailQuery.isError ? (
						<Pressable
							style={styles.retryButton}
							onPress={() => detailQuery.refetch()}
						>
							<Text style={styles.retryText}>
								공고를 불러오지 못했어요. 다시 시도
							</Text>
						</Pressable>
					) : detailQuery.data ? (
						<RecruitmentDetailCard content={detailQuery.data.content} />
					) : null}
				</View>
			)}
		</BackgroundCard>
	);
};

const PreviousRecruitmentsScreen = ({ route, navigation }: Props) => {
	const { clubId, clubName, representativeRecruitmentId } = route.params;
	const { recruitmentService } = useContext(serviceContext);
	const { user } = useProfile();
	const requireLogin = useRequireLogin();
	const [expandedId, setExpandedId] = useState<number | null>(null);
	const listQuery = useQuery(["clubRecruitments", clubId], () =>
		recruitmentService.listClubRecruitments({ clubId }),
	);
	const previousRecruitments =
		listQuery.data?.recruitments.filter(
			(item) => item.id !== representativeRecruitmentId,
		) ?? [];

	return (
		<SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
			<BackHeader title="이전 공고 목록" onBack={() => navigation.goBack()} />
			{!user ? (
				<View style={styles.centerState}>
					<Text style={styles.emptyTitle}>
						로그인 후 이전 공고를 확인할 수 있어요.
					</Text>
					<Pressable
						style={styles.loginButton}
						onPress={() => requireLogin(() => {})}
					>
						<Text style={styles.loginButtonText}>로그인하기</Text>
					</Pressable>
				</View>
			) : listQuery.isLoading ? (
				<View style={styles.centerState}>
					<ActivityIndicator color={Colors.POINTCOLOR} />
				</View>
			) : listQuery.isError ? (
				<View style={styles.centerState}>
					<Text style={styles.emptyTitle}>이전 공고를 불러오지 못했어요.</Text>
					<Pressable
						style={styles.retryButton}
						onPress={() => listQuery.refetch()}
					>
						<Text style={styles.retryText}>다시 시도</Text>
					</Pressable>
				</View>
			) : previousRecruitments.length === 0 ? (
				<View style={styles.centerState}>
					<Text style={styles.emptyTitle}>아직 이전 공고가 없어요.</Text>
				</View>
			) : (
				<ScrollView
					contentContainerStyle={styles.content}
					showsVerticalScrollIndicator={false}
				>
					<Text style={styles.clubName}>{clubName}</Text>
					<View style={styles.list}>
						{previousRecruitments.map((recruitment) => (
							<PreviousRecruitmentItem
								key={recruitment.id}
								recruitment={recruitment}
								isExpanded={expandedId === recruitment.id}
								onPress={() =>
									setExpandedId((current) =>
										getNextExpandedRecruitmentId(current, recruitment.id),
									)
								}
							/>
						))}
					</View>
				</ScrollView>
			)}
		</SafeAreaView>
	);
};

export default PreviousRecruitmentsScreen;

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: Colors.BACKGROUND_MAIN },
	content: {
		paddingHorizontal: s(16),
		paddingTop: vs(12),
		paddingBottom: vs(40),
	},
	clubName: {
		...typography.bodyMRegular,
		color: Colors.BODYTEXT_SUB,
		marginBottom: vs(12),
	},
	list: { gap: vs(12) },
	itemCard: { paddingVertical: s(14) },
	itemHeader: {
		minHeight: ms(44),
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	itemTitleWrapper: { flex: 1, gap: vs(4), paddingRight: s(12) },
	itemTitle: { ...typography.headerL, color: Colors.BODYTEXT_SUB },
	itemTitleExpanded: { color: Colors.POINTCOLOR },
	itemSubtitle: { ...typography.bodySRegular, color: Colors.BODYTEXT_SUB_2 },
	expandedContent: {
		borderTopWidth: 1,
		borderTopColor: Colors.TEXTBOX_SELECTED,
		marginTop: vs(12),
		paddingTop: vs(18),
	},
	centerState: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: s(24),
		gap: vs(12),
	},
	emptyTitle: {
		...typography.bodyMRegular,
		color: Colors.BODYTEXT_SUB,
		textAlign: "center",
	},
	retryButton: {
		paddingHorizontal: s(14),
		paddingVertical: vs(8),
		borderRadius: ms(18),
		backgroundColor: Colors.POINTCOLOR_10,
	},
	retryText: { ...typography.bodySMedium, color: Colors.POINTCOLOR },
	loginButton: {
		minWidth: s(120),
		paddingHorizontal: s(20),
		paddingVertical: vs(12),
		borderRadius: ms(22),
		backgroundColor: Colors.POINTCOLOR,
		alignItems: "center",
	},
	loginButtonText: { ...typography.bodyMSemibold, color: Colors.WHITE },
});
