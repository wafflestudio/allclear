import { BlurView } from "@react-native-community/blur";
import {
	type RouteProp,
	useFocusEffect,
	useRoute,
} from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useContext, useState } from "react";
import {
	ActivityIndicator,
	Image,
	Modal,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/MaterialIcons";

const clubManagementSnuLogo =
	require("@/assets/images/club-management-snu-logo.png") as number;

import OfficialVerificationRequestButton from "@/features/club/components/OfficialVerificationRequestButton";
import VerificationMark from "@/features/club/components/VerificationMark";
import { getOfficialVerificationRequestErrorContent } from "@/features/club/utils/officialVerificationRequest";
import AlertModal from "@/shared/components/AlertModal";
import EditPencilButton from "@/shared/components/EditPencilButton";
import { Colors } from "@/shared/constants/colors";
import { SCREEN_TYPE, type StackParamList } from "@/shared/constants/screen";
import { serviceContext } from "@/shared/contexts/serviceContext";
import { getClubSummaryWithAffiliation } from "@/shared/utils/club";
import { navigation } from "@/shared/utils/navigation";
import { ms, s, vs } from "@/shared/utils/scale";

type RouteProps = RouteProp<StackParamList, typeof SCREEN_TYPE.CLUB_MANAGEMENT>;

const VISIBLE_COUNT = 2;

type DeleteTarget = { id: number; title: string } | null;
type VerificationConfirmation = "request" | "retry" | null;
type VerificationSuccess = {
	isRetry: boolean;
	retryCount: number;
	retryLimit: number;
	remainingRetryCount: number;
};

const VERIFICATION_PROCESSING_DURATION = "최대 일주일";
const MANAGEMENT_VERIFICATION_MARK_SIZE = 16;

const ClubManagementScreen = () => {
	const route = useRoute<RouteProps>();
	const { clubId } = route.params;

	const { clubService, recruitmentService } = useContext(serviceContext);
	const queryClient = useQueryClient();

	const [showMore, setShowMore] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
	const [deletedTitle, setDeletedTitle] = useState<string | null>(null);
	const [showEditConfirm, setShowEditConfirm] = useState(false);
	const [verificationConfirmation, setVerificationConfirmation] =
		useState<VerificationConfirmation>(null);
	const [verificationSuccess, setVerificationSuccess] =
		useState<VerificationSuccess | null>(null);
	const [showRetryLimitNotice, setShowRetryLimitNotice] = useState(false);
	const [isRetryLimitAcknowledged, setIsRetryLimitAcknowledged] =
		useState(false);

	const {
		data: club,
		isLoading: isVerificationStatusLoading,
		refetch: refetchManagedClub,
	} = useQuery({
		queryKey: ["managedClub", clubId],
		queryFn: () => clubService.getManagedClubDetail({ uuid: clubId }),
		staleTime: 0,
		refetchOnWindowFocus: "always",
	});

	const {
		data: recruitmentsData,
		isLoading,
		refetch: refetchRecruitments,
	} = useQuery({
		queryKey: ["clubRecruitments", clubId],
		queryFn: () => recruitmentService.listClubRecruitments({ clubId }),
	});

	const {
		data: representativeRecruitment,
		isLoading: isRepresentativeLoading,
		refetch: refetchRepresentativeRecruitment,
	} = useQuery({
		queryKey: ["clubRepresentativeRecruitment", clubId],
		queryFn: () => recruitmentService.getRepresentativeRecruitment({ clubId }),
	});

	useFocusEffect(
		useCallback(() => {
			refetchManagedClub();
			refetchRecruitments();
			refetchRepresentativeRecruitment();
		}, [
			refetchManagedClub,
			refetchRecruitments,
			refetchRepresentativeRecruitment,
		]),
	);

	const { mutate: deleteRecruitment, isPending: isDeleting } = useMutation({
		mutationFn: (recruitmentId: number) =>
			recruitmentService.deleteRecruitment({ recruitmentId }),
		onSuccess: () => {
			const title = deleteTarget?.title ?? "";
			setDeleteTarget(null);
			setDeletedTitle(title);
			queryClient.invalidateQueries({ queryKey: ["clubRecruitments", clubId] });
			queryClient.invalidateQueries({
				queryKey: ["clubRepresentativeRecruitment", clubId],
			});
		},
		onError: () => {
			setDeleteTarget(null);
		},
	});

	const {
		mutate: requestOfficialVerification,
		isPending: isRequestingVerification,
	} = useMutation({
		mutationFn: (_isRetry: boolean) =>
			clubService.requestOfficialVerification({ clubId }),
		onSuccess: (response, isRetry) => {
			queryClient.invalidateQueries({ queryKey: ["managedClub", clubId] });
			queryClient.invalidateQueries({ queryKey: ["clubs", clubId] });
			setVerificationSuccess({
				isRetry,
				retryCount: response.data.retry_count,
				retryLimit:
					response.data.retry_count + response.data.remaining_retry_count,
				remainingRetryCount: response.data.remaining_retry_count,
			});
		},
		onError: (error) => {
			const errorContent = getOfficialVerificationRequestErrorContent(error);
			queryClient.invalidateQueries({ queryKey: ["managedClub", clubId] });
			queryClient.invalidateQueries({ queryKey: ["clubs", clubId] });
			Toast.show({
				type: "error",
				text1: errorContent.title,
				text2: errorContent.description,
			});
		},
	});

	const recruitments = recruitmentsData?.recruitments ?? [];
	const representativeRecruitmentId = representativeRecruitment?.id ?? null;
	const currentRecruitment =
		recruitments.find(
			(r) => String(r.id) === String(representativeRecruitmentId),
		) ??
		recruitments[0] ??
		null;
	const currentRecruitmentId = currentRecruitment?.id ?? null;
	const previousRecruitments = currentRecruitment
		? recruitments.filter((r) => r.id !== currentRecruitmentId)
		: recruitments;
	const hasMore = previousRecruitments.length > VISIBLE_COUNT;
	const isRecruitmentsLoading = isLoading || isRepresentativeLoading;
	const summary = club ? getClubSummaryWithAffiliation(club) : "";
	const officialVerificationStatus =
		club?.officialVerification?.status ??
		(club?.isOfficialVerified ? "VERIFIED" : undefined);
	const isRetryLimitReached =
		club?.officialVerification?.status === "REJECTED" &&
		club.officialVerification.remainingRetryCount === 0;
	const isRetryConfirmation = verificationConfirmation === "retry";
	const verificationConfirmationTitle = isRetryConfirmation
		? "올클 공식인증이 반려되었어요."
		: "공식 인증을 요청할까요?";
	const verificationConfirmationDescription = isRetryConfirmation
		? "세부사항을 확인하고 인증을 재요청해주세요"
		: "인증된 동아리는 스티커를 부여해드려요.";
	const verificationSuccessDescription = verificationSuccess?.isRetry
		? `재요청은 최대 ${verificationSuccess.retryLimit}회까지 가능해요\n${verificationSuccess.retryCount}/${verificationSuccess.retryLimit}회 (남은 횟수 ${verificationSuccess.remainingRetryCount}회)`
		: `인증이 완료되기까지는\n${VERIFICATION_PROCESSING_DURATION}이 소요될 수 있어요`;

	return (
		<SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
			{/* 헤더 */}
			<View style={styles.header}>
				<Pressable
					style={styles.backBtn}
					onPress={() => navigation.goBack()}
					hitSlop={8}
				>
					<Icon name="chevron-left" size={ms(24)} color="#757474" />
				</Pressable>
				<Text style={styles.headerTitle}>동아리 관리</Text>
			</View>

			<ScrollView
				style={styles.scroll}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				{/* 동아리 카드 */}
				<View style={styles.clubCard}>
					{club?.imageUri ? (
						<Image
							source={{ uri: club.imageUri }}
							style={styles.clubCardBg}
							blurRadius={Platform.OS === "ios" ? 2 : 1}
						/>
					) : (
						<View style={[styles.clubCardBg, { backgroundColor: "#E8E4F0" }]} />
					)}
					<View style={styles.clubCardOverlay} />
					<View style={styles.clubCardContent}>
						<View style={styles.clubDetails}>
							<Image
								source={clubManagementSnuLogo}
								style={styles.clubLogoImage}
							/>
							<View style={styles.clubTexts}>
								<View style={styles.clubNameRow}>
									<Text style={styles.clubName} numberOfLines={1}>
										{club?.name ?? ""}
									</Text>
									<VerificationMark
										status={officialVerificationStatus}
										size={MANAGEMENT_VERIFICATION_MARK_SIZE}
									/>
								</View>
								<Text style={styles.clubDesc} numberOfLines={1}>
									{summary}
								</Text>
							</View>
						</View>
						<EditPencilButton
							accessibilityLabel="동아리 정보 수정"
							onPress={() => setShowEditConfirm(true)}
						/>
					</View>
				</View>

				<OfficialVerificationRequestButton
					status={officialVerificationStatus}
					isStatusLoading={isVerificationStatusLoading}
					isRequesting={isRequestingVerification}
					isRetryLimitReached={isRetryLimitReached}
					isRetryLimitAcknowledged={isRetryLimitAcknowledged}
					onPress={() =>
						isRetryLimitReached
							? setShowRetryLimitNotice(true)
							: setVerificationConfirmation(
									officialVerificationStatus === "REJECTED"
										? "retry"
										: "request",
								)
					}
				/>

				{/* 공고 관리 */}
				<View style={styles.section}>
					<View style={styles.sectionLabel}>
						<Text style={styles.sectionLabelText}>공고 관리</Text>
					</View>

					<View style={styles.listContainer}>
						{/* 새 공고 작성하기 버튼 */}
						<TouchableOpacity
							style={styles.newAnnouncementRow}
							activeOpacity={0.6}
							onPress={() =>
								navigation.navigate(SCREEN_TYPE.ANNOUNCEMENT_REGISTRATION, {
									clubId,
								})
							}
						>
							<Text style={styles.newAnnouncementText}>새 공고 작성하기</Text>
							<Icon name="edit" size={ms(16)} color={Colors.POINTCOLOR} />
						</TouchableOpacity>

						{/* 공고 목록 */}
						{isRecruitmentsLoading ? (
							<ActivityIndicator
								color={Colors.POINTCOLOR}
								style={{ marginVertical: vs(16) }}
							/>
						) : recruitments.length === 0 ? (
							<View style={[styles.row, styles.rowNormal]}>
								<Text style={styles.rowTextGray}>등록된 공고가 없어요</Text>
							</View>
						) : (
							<>
								{/* 대표 공고 - 상단 고정 표시 */}
								{currentRecruitment && (
									<View style={[styles.row, styles.rowActive]}>
										<View style={styles.rowLeft}>
											<View style={styles.badge}>
												<Text style={styles.badgeText} numberOfLines={1}>
													현재 공고
												</Text>
											</View>
											<Text style={styles.rowTextGray} numberOfLines={1}>
												{currentRecruitment.display_title}
											</Text>
										</View>
										<View style={styles.rowIcons}>
											<Pressable
												hitSlop={8}
												onPress={() =>
													navigation.navigate(SCREEN_TYPE.ANNOUNCEMENT_EDIT, {
														recruitmentId: currentRecruitment.id,
													})
												}
											>
												<Icon name="edit" size={ms(16)} color="#C1C1C1" />
											</Pressable>
											<Pressable
												hitSlop={8}
												onPress={() =>
													setDeleteTarget({
														id: currentRecruitment.id,
														title: currentRecruitment.display_title,
													})
												}
											>
												<Icon name="delete" size={ms(16)} color="#C1C1C1" />
											</Pressable>
										</View>
									</View>
								)}

								{/* 나머지 공고 목록 */}
								{previousRecruitments.slice(0, VISIBLE_COUNT).map((item) => (
									<View key={item.id} style={[styles.row, styles.rowNormal]}>
										<View style={styles.rowLeft}>
											<Text style={styles.rowTextGray} numberOfLines={1}>
												{item.display_title}
											</Text>
										</View>
										<View style={styles.rowIcons}>
											<Pressable
												hitSlop={8}
												onPress={() =>
													navigation.navigate(SCREEN_TYPE.ANNOUNCEMENT_EDIT, {
														recruitmentId: item.id,
													})
												}
											>
												<Icon name="edit" size={ms(16)} color="#C1C1C1" />
											</Pressable>
											<Pressable
												hitSlop={8}
												onPress={() =>
													setDeleteTarget({
														id: item.id,
														title: item.display_title,
													})
												}
											>
												<Icon name="delete" size={ms(16)} color="#C1C1C1" />
											</Pressable>
										</View>
									</View>
								))}

								{hasMore && (
									<Pressable
										style={[styles.row, styles.rowMore]}
										onPress={() => setShowMore((prev) => !prev)}
									>
										<Text style={styles.rowMoreText}>이전 공고 더보기</Text>
										<Icon
											name={showMore ? "expand-less" : "expand-more"}
											size={ms(18)}
											color={Colors.POINTCOLOR}
										/>
									</Pressable>
								)}

								{showMore &&
									previousRecruitments.slice(VISIBLE_COUNT).map((item) => (
										<View key={item.id} style={[styles.row, styles.rowMore]}>
											<View style={styles.rowLeft}>
												<Text style={styles.rowTextGray} numberOfLines={1}>
													{item.display_title}
												</Text>
											</View>
											<View style={styles.rowIcons}>
												<Pressable
													hitSlop={8}
													onPress={() =>
														navigation.navigate(SCREEN_TYPE.ANNOUNCEMENT_EDIT, {
															recruitmentId: item.id,
														})
													}
												>
													<Icon name="edit" size={ms(16)} color="#C1C1C1" />
												</Pressable>
												<Pressable
													hitSlop={8}
													onPress={() =>
														setDeleteTarget({
															id: item.id,
															title: item.display_title,
														})
													}
												>
													<Icon name="delete" size={ms(16)} color="#C1C1C1" />
												</Pressable>
											</View>
										</View>
									))}
							</>
						)}
					</View>
				</View>

				{/* 운영진 목록 */}
				<View style={styles.section}>
					<View style={styles.sectionLabel}>
						<Text style={styles.sectionLabelText}>운영진 목록</Text>
					</View>
					<View style={styles.listContainer}>
						{!club?.managers || club.managers.length === 0 ? (
							<View
								style={[
									styles.row,
									styles.rowNormal,
									{ justifyContent: "center" },
								]}
							>
								<Text style={styles.rowTextGray}>등록된 운영진이 없어요</Text>
							</View>
						) : (
							club.managers.map((manager) => (
								<View
									key={manager.serviceUserId}
									style={[styles.row, styles.rowNormal]}
								>
									<Text style={styles.managerName}>{manager.name}</Text>
									{!!manager.studentId && (
										<Text style={styles.managerStudentId}>
											{manager.studentId}
										</Text>
									)}
								</View>
							))
						)}
					</View>
				</View>
			</ScrollView>

			<AlertModal
				visible={verificationConfirmation !== null}
				onClose={() =>
					!isRequestingVerification && setVerificationConfirmation(null)
				}
				title={verificationConfirmationTitle}
				titleContent={
					isRetryConfirmation ? (
						<>
							올클 공식인증이{" "}
							<Text style={styles.verificationPointModalTitle}>
								반려되었어요.
							</Text>
						</>
					) : (
						<>
							<Text style={styles.verificationPointModalTitle}>
								공식 인증을 요청
							</Text>
							할까요?
						</>
					)
				}
				description={verificationConfirmationDescription}
				buttonLabel={isRetryConfirmation ? "재요청" : "확인"}
				onButtonPress={() => {
					const isRetry = verificationConfirmation === "retry";
					setVerificationConfirmation(null);
					requestOfficialVerification(isRetry);
				}}
				buttonDisabled={isRequestingVerification}
				hasCancel
				dismissOnBackdropPress={!isRequestingVerification}
			/>

			<AlertModal
				visible={verificationSuccess !== null}
				onClose={() => setVerificationSuccess(null)}
				title={
					verificationSuccess?.isRetry
						? "인증 재요청이 정상적으로 완료되었어요!"
						: "인증요청이 정상적으로 완료되었어요!"
				}
				titleStyle={styles.verificationSuccessModalTitle}
				description={verificationSuccessDescription}
				descriptionContent={
					verificationSuccess?.isRetry ? (
						<>
							재요청은 최대 {verificationSuccess.retryLimit}회까지 가능해요
							{"\n"}
							<Text style={styles.verificationPointModalTitle}>
								{verificationSuccess.retryCount}
							</Text>
							/{verificationSuccess.retryLimit}회 (남은 횟수{" "}
							<Text style={styles.verificationPointModalTitle}>
								{verificationSuccess.remainingRetryCount}
							</Text>
							회)
						</>
					) : undefined
				}
				buttonLabel="확인"
				onButtonPress={() => setVerificationSuccess(null)}
			/>

			<AlertModal
				visible={showRetryLimitNotice}
				onClose={() => setShowRetryLimitNotice(false)}
				title={"공식인증 재요청 가능 횟수가\n모두 소진되었어요."}
				titleStyle={styles.verificationRetryLimitModalTitle}
				description="아쉽지만 다음학기에 요청해주세요."
				buttonLabel="확인"
				onButtonPress={() => {
					setShowRetryLimitNotice(false);
					setIsRetryLimitAcknowledged(true);
				}}
				hasCancel
			/>

			{/* 동아리 정보 수정 확인 모달 */}
			<Modal
				visible={showEditConfirm}
				transparent
				animationType="fade"
				onRequestClose={() => setShowEditConfirm(false)}
			>
				<Pressable
					style={styles.modalOverlay}
					onPress={() => setShowEditConfirm(false)}
				>
					<BlurView
						style={StyleSheet.absoluteFillObject}
						blurType="light"
						blurAmount={1}
						overlayColor="transparent"
						reducedTransparencyFallbackColor="transparent"
					/>
					<Pressable
						style={styles.modalCard}
						onPress={(e) => e.stopPropagation()}
					>
						<View style={styles.modalContents}>
							<Text style={styles.modalTitle}>동아리 정보를 수정할까요?</Text>
							<Text style={styles.modalDesc}>
								동아리 정보는 동아리 관리 → 수정 탭에서{"\n"}언제든 수정
								가능해요
							</Text>
						</View>
						<View style={styles.modalActions}>
							<TouchableOpacity
								style={styles.modalCancelBtn}
								onPress={() => setShowEditConfirm(false)}
								activeOpacity={0.6}
							>
								<Text style={styles.modalCancelText}>취소</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={styles.modalConfirmBtn}
								onPress={() => {
									setShowEditConfirm(false);
									navigation.navigate(SCREEN_TYPE.CLUB_INFO_EDIT, { clubId });
								}}
								activeOpacity={0.6}
							>
								<Text style={styles.modalConfirmText}>수정</Text>
							</TouchableOpacity>
						</View>
					</Pressable>
				</Pressable>
			</Modal>

			{/* 삭제 확인 모달 */}
			<Modal
				visible={deleteTarget !== null}
				transparent
				animationType="fade"
				onRequestClose={() => !isDeleting && setDeleteTarget(null)}
			>
				<Pressable
					style={styles.modalOverlay}
					onPress={() => !isDeleting && setDeleteTarget(null)}
				>
					<BlurView
						style={StyleSheet.absoluteFillObject}
						blurType="light"
						blurAmount={1}
						overlayColor="transparent"
						reducedTransparencyFallbackColor="transparent"
					/>
					<Pressable
						style={styles.modalCard}
						onPress={(e) => e.stopPropagation()}
					>
						{/* Contents */}
						<View style={styles.modalContents}>
							<Text style={styles.modalTitle}>
								{deleteTarget?.title ?? ""} 삭제
							</Text>
							<Text style={styles.modalDesc}>
								공고를 삭제하면 되돌릴 수 없어요.
							</Text>
						</View>
						{/* Actions */}
						<View style={styles.modalActions}>
							<TouchableOpacity
								style={styles.modalCancelBtn}
								onPress={() => setDeleteTarget(null)}
								disabled={isDeleting}
								activeOpacity={0.6}
							>
								<Text style={styles.modalCancelText}>취소</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.modalConfirmBtn, isDeleting && { opacity: 0.6 }]}
								onPress={() =>
									deleteTarget && deleteRecruitment(deleteTarget.id)
								}
								disabled={isDeleting}
								activeOpacity={0.6}
							>
								<Text style={styles.modalConfirmText}>
									{isDeleting ? "삭제 중..." : "삭제"}
								</Text>
							</TouchableOpacity>
						</View>
					</Pressable>
				</Pressable>
			</Modal>

			{/* 삭제 완료 모달 */}
			<Modal
				visible={deletedTitle !== null}
				transparent
				animationType="fade"
				onRequestClose={() => setDeletedTitle(null)}
			>
				<Pressable
					style={styles.modalOverlay}
					onPress={() => setDeletedTitle(null)}
				>
					<BlurView
						style={StyleSheet.absoluteFillObject}
						blurType="light"
						blurAmount={1}
						overlayColor="transparent"
						reducedTransparencyFallbackColor="transparent"
					/>
					<Pressable
						style={styles.modalCard}
						onPress={(e) => e.stopPropagation()}
					>
						<View style={styles.modalContents}>
							<Text style={styles.modalTitle}>
								{deletedTitle}
								<Text style={styles.modalTitleBlack}>{"가 삭제되었어요."}</Text>
							</Text>
						</View>
						<TouchableOpacity
							style={styles.modalSingleBtn}
							activeOpacity={0.6}
							onPress={() => setDeletedTitle(null)}
						>
							<Text style={styles.modalConfirmText}>확인</Text>
						</TouchableOpacity>
					</Pressable>
				</Pressable>
			</Modal>
		</SafeAreaView>
	);
};

export default ClubManagementScreen;

const styles = StyleSheet.create({
	verificationPointModalTitle: {
		color: Colors.POINTCOLOR,
	},
	verificationSuccessModalTitle: {
		color: Colors.BLACK,
	},
	verificationRetryLimitModalTitle: {
		color: Colors.BODYTEXT_MAIN,
	},
	safeArea: {
		flex: 1,
		backgroundColor: "#FFFFFF",
	},

	// ── 헤더
	header: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: s(20),
		gap: s(105),
		height: vs(39),
		backgroundColor: "#FFFFFF",
	},
	backBtn: {
		width: ms(24),
		height: ms(24),
		justifyContent: "center",
		alignItems: "center",
	},
	headerTitle: {
		fontFamily: "Pretendard",
		fontWeight: "600",
		fontSize: ms(16),
		lineHeight: ms(19),
		letterSpacing: -0.02 * 16,
		color: "#757474",
	},

	// ── 스크롤 영역
	scroll: {
		flex: 1,
		backgroundColor: "#F5F4F0",
	},
	scrollContent: {
		paddingHorizontal: s(20),
		paddingTop: vs(10),
		paddingBottom: vs(40),
		gap: vs(20),
	},

	// ── 동아리 카드
	clubCard: {
		borderRadius: ms(12),
		overflow: "hidden",
		height: vs(186),
	},
	clubCardBg: {
		position: "absolute",
		width: "100%",
		height: "100%",
		resizeMode: "cover",
	},
	clubCardOverlay: {
		position: "absolute",
		width: "100%",
		height: "100%",
		backgroundColor: "rgba(255,255,255,0.6)",
	},
	clubCardContent: {
		flex: 1,
		flexDirection: "row",
		alignItems: "flex-start",
		justifyContent: "space-between",
		paddingHorizontal: s(20),
		paddingVertical: vs(30),
	},
	clubDetails: {
		flex: 1,
		marginRight: s(16),
		gap: vs(12),
		alignItems: "flex-start",
	},
	clubLogoImage: {
		width: ms(40),
		height: ms(40),
		borderRadius: ms(20),
		opacity: 1,
		resizeMode: "contain",
	},
	clubTexts: {
		alignSelf: "stretch",
		gap: vs(8),
	},
	clubNameRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: s(4),
	},
	clubName: {
		fontFamily: "Pretendard",
		fontWeight: "700",
		fontSize: ms(20),
		lineHeight: ms(24),
		letterSpacing: -0.02 * 20,
		color: "#000000",
		flexShrink: 1,
	},
	clubDesc: {
		fontFamily: "Pretendard",
		fontWeight: "500",
		fontSize: ms(14),
		lineHeight: ms(17),
		letterSpacing: -0.02 * 14,
		color: "#757474",
	},

	// ── 섹션
	section: {
		gap: 0,
	},
	sectionLabel: {
		flexDirection: "row",
		alignItems: "center",
		paddingTop: vs(5),
		paddingBottom: vs(5),
		paddingLeft: s(5),
		paddingRight: s(12),
		height: vs(34),
	},
	sectionLabelText: {
		fontFamily: "Pretendard",
		fontWeight: "500",
		fontSize: ms(14),
		lineHeight: ms(24),
		color: "#757474",
		flex: 1,
	},

	// ── 리스트 컨테이너
	listContainer: {
		gap: vs(10),
	},

	// ── 새 공고 작성하기
	newAnnouncementRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: vs(10),
		paddingHorizontal: s(15),
		borderRadius: ms(12),
		minHeight: vs(34),
		backgroundColor: "#FFFFFF",
		borderWidth: 1,
		borderColor: Colors.POINTCOLOR,
	},
	newAnnouncementText: {
		fontFamily: "Pretendard",
		fontWeight: "500",
		fontSize: ms(12),
		lineHeight: ms(14),
		letterSpacing: -0.02 * 12,
		color: Colors.POINTCOLOR,
	},

	// ── 공고 행 공통
	row: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: vs(10),
		paddingHorizontal: s(15),
		borderRadius: ms(12),
		minHeight: vs(34),
	},
	rowNormal: {
		backgroundColor: "#FFFFFF",
	},
	rowActive: {
		backgroundColor: "#FFFFFF",
		minHeight: vs(48),
		paddingLeft: s(10),
	},
	rowMore: {
		backgroundColor: "#F3F0F5",
	},
	rowLeft: {
		flexDirection: "row",
		alignItems: "center",
		gap: s(10),
		flex: 1,
	},
	rowIcons: {
		flexDirection: "row",
		alignItems: "center",
		gap: s(12),
		flexShrink: 0,
	},

	// ── 이전 공고 더보기
	rowMoreText: {
		fontFamily: "Pretendard",
		fontWeight: "500",
		fontSize: ms(12),
		lineHeight: ms(14),
		letterSpacing: -0.02 * 12,
		color: Colors.POINTCOLOR,
	},

	// ── 현재 공고 배지
	badge: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: s(10),
		paddingVertical: vs(8),
		backgroundColor: Colors.POINTCOLOR,
		borderRadius: ms(12),
		minWidth: ms(68),
		height: ms(28),
		flexShrink: 0,
	},
	badgeText: {
		fontFamily: "Pretendard",
		fontWeight: "600",
		fontSize: ms(10),
		lineHeight: ms(12),
		letterSpacing: 0,
		color: "#FFFFFF",
	},

	// ── 공고 제목 텍스트
	rowTextGray: {
		fontFamily: "Pretendard",
		fontWeight: "500",
		fontSize: ms(12),
		lineHeight: ms(14),
		letterSpacing: -0.02 * 12,
		color: "#757474",
		flex: 1,
	},
	managerName: {
		fontFamily: "Pretendard",
		fontWeight: "600",
		fontSize: ms(13),
		color: "#333",
		flex: 1,
	},
	managerStudentId: {
		fontFamily: "Pretendard",
		fontWeight: "400",
		fontSize: ms(12),
		color: "#757474",
	},

	// ── 삭제 확인 모달
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.2)",
		justifyContent: "center",
		alignItems: "center",
	},
	modalCard: {
		width: ms(320),
		backgroundColor: "#FFFFFF",
		borderRadius: ms(12),
		padding: ms(24),
		gap: ms(24),
		alignItems: "center",
	},
	modalContents: {
		alignSelf: "stretch",
		alignItems: "center",
		gap: ms(8),
	},
	modalTitle: {
		fontFamily: "Apple SD Gothic Neo",
		fontWeight: "700",
		fontSize: ms(16),
		lineHeight: ms(24),
		color: Colors.POINTCOLOR,
		textAlign: "center",
		alignSelf: "stretch",
	},
	modalDesc: {
		fontFamily: "Apple SD Gothic Neo",
		fontWeight: "500",
		fontSize: ms(14),
		lineHeight: ms(24),
		color: "#000000",
		textAlign: "center",
		alignSelf: "stretch",
	},
	modalActions: {
		flexDirection: "row",
		alignSelf: "stretch",
		gap: ms(7),
	},
	modalCancelBtn: {
		width: ms(128),
		height: ms(44),
		borderWidth: 1,
		borderColor: Colors.POINTCOLOR,
		borderRadius: ms(8),
		justifyContent: "center",
		alignItems: "center",
	},
	modalCancelText: {
		fontFamily: "Apple SD Gothic Neo",
		fontWeight: "700",
		fontSize: ms(16),
		lineHeight: ms(20),
		color: Colors.POINTCOLOR,
	},
	modalConfirmBtn: {
		width: ms(128),
		height: ms(44),
		backgroundColor: Colors.POINTCOLOR,
		borderRadius: ms(8),
		justifyContent: "center",
		alignItems: "center",
	},
	modalTitleBlack: {
		color: "#000000",
	},
	modalConfirmText: {
		fontFamily: "Apple SD Gothic Neo",
		fontWeight: "600",
		fontSize: ms(16),
		lineHeight: ms(20),
		color: "#FFFFFF",
	},
	modalSingleBtn: {
		alignSelf: "stretch",
		height: ms(44),
		backgroundColor: Colors.POINTCOLOR,
		borderRadius: ms(8),
		justifyContent: "center",
		alignItems: "center",
	},
});
