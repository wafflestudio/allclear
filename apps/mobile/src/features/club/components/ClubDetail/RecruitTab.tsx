import dayjs from "dayjs";
import "dayjs/locale/ko";
import { useQuery } from "@tanstack/react-query";
import { useContext } from "react";
import {
	ActivityIndicator,
	Pressable,
	StyleSheet,
	Text,
	View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import type { Club } from "@/entities/club";
import { Colors } from "@/shared/constants/colors";
import { typography } from "@/shared/constants/typography";
import { serviceContext } from "@/shared/contexts/serviceContext";
import { ms, s, vs } from "@/shared/utils/scale";
import BackgroundCard from "./BackgroundCard";
import type { ClubDetailTabLabel } from "./ClubDetailTabBar";
import LoginBlurOverlay from "./LoginBlurOverlay";
import RecruitmentDetailCard from "./RecruitmentDetailCard";

dayjs.locale("ko");

type Props = {
	club: Club;
	tabLabel: ClubDetailTabLabel;
	contentWidth: number;
	isLoggedIn: boolean;
	onLoginPress: () => void;
	onPreviousPress: (representativeRecruitmentId: number | null) => void;
};

const RecruitTab = ({
	club,
	tabLabel,
	contentWidth,
	isLoggedIn,
	onLoginPress,
	onPreviousPress,
}: Props) => {
	const { recruitmentService } = useContext(serviceContext);
	const representativeQuery = useQuery(
		["representativeRecruitment", club.uuid],
		() =>
			recruitmentService.getRepresentativeRecruitment({ clubId: club.uuid }),
	);
	const representativeId = representativeQuery.data?.id ?? null;
	const detailQuery = useQuery(
		["recruitmentDetail", representativeId],
		() =>
			recruitmentService.getRecruitmentDetail({
				recruitmentId: representativeId as number,
			}),
		{ enabled: representativeId !== null },
	);
	const isLoading =
		representativeQuery.isLoading ||
		(representativeId !== null && detailQuery.isLoading);
	const isError = representativeQuery.isError || detailQuery.isError;
	const content = detailQuery.data?.content;
	const updatedAt = club.articleUploadedAt
		? dayjs(club.articleUploadedAt)
		: null;

	return (
		<View style={styles.tabSection}>
			<BackgroundCard style={styles.articleCard}>
				{isLoading ? (
					<View style={styles.centerState}>
						<ActivityIndicator color={Colors.POINTCOLOR} />
					</View>
				) : isError ? (
					<View style={styles.centerState}>
						<Text style={styles.emptyText}>모집공고를 불러오지 못했어요.</Text>
						<Pressable
							style={styles.retryButton}
							onPress={() => {
								representativeQuery.refetch();
								if (representativeId !== null) detailQuery.refetch();
							}}
						>
							<Text style={styles.retryText}>다시 시도</Text>
						</Pressable>
					</View>
				) : content ? (
					<>
						{!isLoggedIn && (
							<LoginBlurOverlay
								clubName={club.name}
								tabLabel={tabLabel}
								onLoginPress={onLoginPress}
							/>
						)}
						<RecruitmentDetailCard
							content={content}
							contentWidth={contentWidth}
						/>
					</>
				) : (
					<View style={styles.centerState}>
						<Text style={styles.emptyText}>아직 등록된 모집공고가 없어요.</Text>
					</View>
				)}
			</BackgroundCard>

			{content && (
				<View style={styles.recruitFooter}>
					{updatedAt && (
						<Text style={styles.sectionMeta}>
							{updatedAt.format(
								(updatedAt.year() === dayjs().year() ? "" : "YY년 ") +
									"M월 D일 dddd A h시에 업데이트 되었어요",
							)}
						</Text>
					)}
				</View>
			)}

			<Pressable
				accessibilityRole="button"
				style={({ pressed }) => [
					styles.previousButton,
					pressed && styles.pressed,
				]}
				onPress={() => onPreviousPress(representativeId)}
			>
				<Text style={styles.previousButtonText}>이전 공고 확인하기</Text>
				<Icon
					name="chevron-right"
					size={ms(16)}
					color={Colors.BODYTEXT_DISABLED}
				/>
			</Pressable>
		</View>
	);
};

export default RecruitTab;

const styles = StyleSheet.create({
	tabSection: { marginTop: vs(16), gap: vs(12) },
	articleCard: { minHeight: vs(200) },
	centerState: {
		minHeight: vs(160),
		justifyContent: "center",
		alignItems: "center",
		gap: vs(10),
	},
	emptyText: {
		...typography.bodySRegular,
		color: Colors.BODYTEXT_SUB,
		textAlign: "center",
	},
	retryButton: {
		paddingHorizontal: s(14),
		paddingVertical: vs(8),
		borderRadius: ms(16),
		backgroundColor: Colors.POINTCOLOR_10,
	},
	retryText: { ...typography.bodySMedium, color: Colors.POINTCOLOR },
	recruitFooter: { paddingHorizontal: s(10) },
	sectionMeta: { ...typography.bodySRegular, color: Colors.BODYTEXT_SUB },
	previousButton: {
		height: vs(66),
		borderRadius: ms(12),
		backgroundColor: Colors.WHITE,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: s(16),
		paddingVertical: vs(6),
		shadowColor: Colors.BLACK,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 5,
		elevation: 1,
	},
	previousButtonText: {
		...typography.bodyMBold13px,
		color: Colors.BODYTEXT_DISABLED,
	},
	pressed: { opacity: 0.6 },
});
