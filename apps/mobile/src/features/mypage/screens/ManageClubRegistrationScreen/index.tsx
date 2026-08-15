import { type RouteProp, useRoute } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext, useEffect, useState } from "react";
import {
	Image,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Club } from "@/entities/club";
import { getManagedClubUpdateErrorContent } from "@/features/club/utils/managedClubUpdateError";
import { FormNavigationButtons } from "@/features/register-club/components/FormNavigationButtons";
import AlertModal from "@/shared/components/AlertModal";
import FlowScreenFooter from "@/shared/components/FlowScreenFooter";
import FlowScreenLayout from "@/shared/components/FlowScreenLayout";
import TextField from "@/shared/components/TextField";
import { Colors } from "@/shared/constants/colors";
import { SCREEN_TYPE, type StackParamList } from "@/shared/constants/screen";
import { typography } from "@/shared/constants/typography";
import { useProfile } from "@/shared/contexts/profileContext";
import { serviceContext } from "@/shared/contexts/serviceContext";
import { getClubSummaryWithAffiliation } from "@/shared/utils/club";
import {
	formatPhoneNumberInput,
	formatStudentIdInput,
	getPhoneNumberPrefill,
	getStudentIdPrefill,
} from "@/shared/utils/managerInfo";
import { navigation } from "@/shared/utils/navigation";
import { s, vs } from "@/shared/utils/scale";

type AdminFormData = {
	name: string;
	phone: string;
	studentId: string;
};

type AdminFormErrors = {
	name?: string;
	phone?: string;
	studentId?: string;
};

const ManageClubRegistrationScreen = () => {
	const { clubService } = useContext(serviceContext);
	const { user } = useProfile();
	const queryClient = useQueryClient();
	const route =
		useRoute<
			RouteProp<StackParamList, typeof SCREEN_TYPE.MANAGE_CLUB_REGISTRATION>
		>();
	const editClubId = route.params?.clubId;
	const editMode = route.params?.editMode;
	const isResubmission = route.params?.isResubmission ?? false;
	const isManagerRequestEditMode = editMode === "managerRequest";
	const isClubRegistrationEditMode = editMode === "clubRegistration";
	const isEditMode = editClubId !== undefined && editMode !== undefined;

	const [formStep, setFormStep] = useState<"form" | "clubSearch">("form");
	const [adminForm, setAdminForm] = useState<AdminFormData>({
		name: isEditMode ? "" : (user?.name ?? ""),
		phone: isEditMode ? "" : getPhoneNumberPrefill(user?.phone ?? ""),
		studentId: isEditMode
			? ""
			: getStudentIdPrefill(user?.admissionClass ?? null),
	});
	const [adminFormErrors, setAdminFormErrors] = useState<AdminFormErrors>({});
	const [clubSearchQuery, setClubSearchQuery] = useState<string>("");
	const [searchResults, setSearchResults] = useState<Club[]>([]);
	const [selectedClubId, setSelectedClubId] = useState<string>("");
	const [clubPendingRequest, setClubPendingRequest] = useState<Club | null>(
		null,
	);
	const [isExistingManagerModalVisible, setIsExistingManagerModalVisible] =
		useState(false);
	const [
		isPendingManagerRequestModalVisible,
		setIsPendingManagerRequestModalVisible,
	] = useState(false);
	const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
	const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
	const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);

	const { data: manageClubs = [] } = useQuery({
		queryKey: ["manageClubs"],
		queryFn: () => clubService.listManageClubs(),
		select: (data) => data.clubs,
		enabled: !isEditMode,
	});

	const {
		data: initialManagerInfo,
		isLoading: isManagerInfoLoading,
		isError: isManagerInfoError,
		error: managerInfoError,
		refetch: refetchManagerInfo,
	} = useQuery({
		queryKey: ["clubManagerInfo", editMode, editClubId],
		queryFn: () => {
			if (!editClubId || !editMode) {
				throw new Error(
					"Club id and edit mode are required to load manager info",
				);
			}

			if (editMode === "clubRegistration") {
				return clubService.getManagedClubManager({ uuid: editClubId });
			}

			return clubService.getClubManagerRequest({ clubId: editClubId });
		},
		enabled: isEditMode,
	});

	useEffect(() => {
		if (!initialManagerInfo) return;

		setAdminForm({
			name: initialManagerInfo.name,
			phone: initialManagerInfo.phone,
			studentId: initialManagerInfo.studentId,
		});
	}, [initialManagerInfo]);

	useEffect(() => {
		if (isManagerInfoError) {
			setIsErrorModalVisible(true);
		}
	}, [isManagerInfoError]);

	useEffect(() => {
		if (!user || isEditMode) {
			return;
		}

		const phone = getPhoneNumberPrefill(user.phone);
		const studentId = getStudentIdPrefill(user.admissionClass);
		setAdminForm((prev) => ({
			...prev,
			name: prev.name || user.name,
			phone: prev.phone || phone,
			studentId: prev.studentId || studentId,
		}));
	}, [isEditMode, user]);

	useEffect(() => {
		const timer = setTimeout(async () => {
			if (!clubSearchQuery.trim()) {
				setSearchResults([]);
				return;
			}

			try {
				const { clubs } = await clubService.searchClubs({
					query: clubSearchQuery,
				});
				setSearchResults(clubs);
			} catch {
				setSearchResults([]);
			}
		}, 500);

		return () => clearTimeout(timer);
	}, [clubSearchQuery, clubService]);

	useEffect(() => {
		if (
			selectedClubId &&
			!searchResults.some((club) => club.uuid === selectedClubId)
		) {
			setSelectedClubId("");
		}
	}, [searchResults, selectedClubId]);

	const validatePhoneNumber = (phone: string): boolean => {
		const phoneRegex = /^01[0-9]\d{8}$/;
		return phoneRegex.test(phone.replace(/-/g, ""));
	};

	const validateStudentId = (studentId: string): boolean => {
		const studentIdRegex = /^\d{4}-\d{5}$/;
		return studentIdRegex.test(studentId);
	};

	const validateAdminForm = (): boolean => {
		const errors: AdminFormErrors = {};

		if (!adminForm.name.trim()) {
			errors.name = "이름을 입력해주세요";
		}

		if (!adminForm.phone.trim() || !validatePhoneNumber(adminForm.phone)) {
			errors.phone = "올바른 전화번호 형식으로 입력해주세요";
		}

		if (
			!adminForm.studentId.trim() ||
			!validateStudentId(adminForm.studentId)
		) {
			errors.studentId = "2023-12345 형식으로 입력해주세요";
		}

		setAdminFormErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const isFormFieldsValid =
		adminForm.name.trim() !== "" &&
		adminForm.phone.trim() !== "" &&
		validatePhoneNumber(adminForm.phone) &&
		adminForm.studentId.trim() !== "" &&
		validateStudentId(adminForm.studentId);
	const hasManagerInfoChanges =
		initialManagerInfo !== undefined &&
		(adminForm.name !== initialManagerInfo.name ||
			adminForm.phone !== initialManagerInfo.phone ||
			adminForm.studentId !== initialManagerInfo.studentId);
	const isManagerInfoPrefillLoading = isEditMode && isManagerInfoLoading;
	const managerInfoErrorContent =
		getManagedClubUpdateErrorContent(managerInfoError);

	const handleBack = () => {
		if (formStep === "clubSearch") {
			setFormStep("form");
			setClubSearchQuery("");
			setSearchResults([]);
			setSelectedClubId("");
			return;
		}

		navigation.goBack();
	};

	const handleFormNext = async () => {
		if (!validateAdminForm()) return;

		if (editClubId && isClubRegistrationEditMode) {
			const managerData = hasManagerInfoChanges
				? {
						...(adminForm.name !== initialManagerInfo?.name && {
							name: adminForm.name,
						}),
						...(adminForm.phone !== initialManagerInfo?.phone && {
							phone: adminForm.phone,
						}),
						...(adminForm.studentId !== initialManagerInfo?.studentId && {
							studentId: adminForm.studentId,
						}),
					}
				: undefined;

			navigation.navigate(SCREEN_TYPE.CLUB_INFO_EDIT, {
				clubId: editClubId,
				fromClubRegistrationEdit: true,
				isResubmission,
				managerData,
			});
			return;
		}

		if (editClubId && isManagerRequestEditMode) {
			if (isSubmittingRequest || (!isResubmission && !hasManagerInfoChanges))
				return;

			setIsSubmittingRequest(true);
			try {
				await clubService.updateClubManagerRequest({
					clubId: editClubId,
					...(adminForm.name !== initialManagerInfo?.name && {
						name: adminForm.name,
					}),
					...(adminForm.phone !== initialManagerInfo?.phone && {
						phone: adminForm.phone,
					}),
					...(adminForm.studentId !== initialManagerInfo?.studentId && {
						studentId: adminForm.studentId,
					}),
					...(isResubmission && { resubmit: true }),
				});
				queryClient.setQueryData(
					["clubManagerInfo", editMode, editClubId],
					adminForm,
				);
				setIsSuccessModalVisible(true);
			} catch {
				setIsErrorModalVisible(true);
			} finally {
				setIsSubmittingRequest(false);
			}
			return;
		}

		setFormStep("clubSearch");
	};

	const handleClubSelect = (clubId: string) => {
		setSelectedClubId(clubId);
	};

	const submitClubRequest = async (club: Club) => {
		if (isSubmittingRequest) return;

		setIsSubmittingRequest(true);
		try {
			await clubService.requestClubManager({
				clubId: club.uuid,
				name: adminForm.name,
				phone: adminForm.phone,
				studentId: adminForm.studentId,
			});
			setIsSuccessModalVisible(true);
		} catch {
			setIsErrorModalVisible(true);
		} finally {
			setIsSubmittingRequest(false);
		}
	};

	const handleClubAddPress = (club: Club) => {
		setSelectedClubId(club.uuid);

		const hasPendingManagerRequest = manageClubs.some(
			(managedClub) =>
				managedClub.uuid === club.uuid &&
				managedClub.managementStatus === "MANAGER_REQUEST_PENDING",
		);

		if (hasPendingManagerRequest) {
			setIsPendingManagerRequestModalVisible(true);
			return;
		}

		if (club.hasManager) {
			setIsExistingManagerModalVisible(true);
			return;
		}

		setClubPendingRequest(club);
	};

	const handleClubRequestConfirm = () => {
		if (!clubPendingRequest) return;

		const club = clubPendingRequest;
		setClubPendingRequest(null);
		void submitClubRequest(club);
	};

	const handleSuccessConfirm = () => {
		setIsSuccessModalVisible(false);
		setFormStep("form");
		setAdminForm({
			name: user?.name ?? "",
			phone: getPhoneNumberPrefill(user?.phone ?? ""),
			studentId: getStudentIdPrefill(user?.admissionClass ?? null),
		});
		setAdminFormErrors({});
		setClubSearchQuery("");
		setSearchResults([]);
		setSelectedClubId("");
		if (isEditMode) {
			navigation.goBack();
			return;
		}

		navigation.setRoot("마이");
	};

	const handleRetryManagerInfo = async () => {
		setIsErrorModalVisible(false);
		const result = await refetchManagerInfo();
		if (result.isError) {
			setIsErrorModalVisible(true);
		}
	};

	const renderResultModals = () => (
		<>
			<AlertModal
				visible={isSuccessModalVisible}
				onClose={() => setIsSuccessModalVisible(false)}
				title={
					isResubmission
						? "운영진 권한을\n재신청했어요."
						: isEditMode
							? "운영진 권한 신청 내용이\n수정되었어요!"
							: "운영진 권한 요청이\n정상적으로 완료되었어요!"
				}
				buttonLabel="확인"
				onButtonPress={handleSuccessConfirm}
				dismissOnBackdropPress
			/>
			<AlertModal
				visible={isErrorModalVisible}
				onClose={() => setIsErrorModalVisible(false)}
				title={
					isManagerInfoError
						? managerInfoErrorContent.title
						: "실행이 완료되지 않았어요"
				}
				description={
					isManagerInfoError
						? managerInfoErrorContent.description
						: "네트워크 문제로 실행이 완료되지 않았어요\n네트워크 상태를 확인한 후, 다시 시도해주세요"
				}
				buttonLabel={isManagerInfoError ? "다시 시도" : "확인"}
				onButtonPress={() => {
					if (isManagerInfoError) {
						void handleRetryManagerInfo();
						return;
					}
					setIsErrorModalVisible(false);
				}}
				dismissOnBackdropPress={false}
			/>
		</>
	);

	const renderForm = () => (
		<SafeAreaView edges={["top", "left", "right"]} style={styles.container}>
			<ScrollView contentContainerStyle={styles.formContent}>
				<View style={styles.formHeader}>
					<Text style={styles.formTitle}>운영진 기본 정보를</Text>
					<Text style={styles.formTitle}>입력해주세요</Text>
				</View>

				<View style={styles.form}>
					<View>
						<Text style={styles.formFieldLabel}>이름</Text>
						<TextField
							height={54}
							style={styles.formInput}
							placeholder="홍길동"
							maxLength={50}
							value={adminForm.name}
							editable={!isManagerInfoPrefillLoading}
							onChangeText={(text) => {
								setAdminForm((prev) => ({ ...prev, name: text }));
								if (adminFormErrors.name) {
									setAdminFormErrors((prev) => ({
										...prev,
										name: undefined,
									}));
								}
							}}
						/>
						<Text style={styles.formHelperText}>이름을 입력해주세요</Text>
					</View>

					<View>
						<Text style={styles.formFieldLabel}>전화번호</Text>
						<TextField
							height={54}
							style={styles.formInput}
							placeholder="010-1234-5678"
							keyboardType="number-pad"
							maxLength={13}
							value={adminForm.phone}
							editable={!isManagerInfoPrefillLoading}
							onChangeText={(text) => {
								setAdminForm((prev) => ({
									...prev,
									phone: formatPhoneNumberInput(text, prev.phone),
								}));
								if (adminFormErrors.phone) {
									setAdminFormErrors((prev) => ({
										...prev,
										phone: undefined,
									}));
								}
							}}
						/>
						<Text style={styles.formHelperText}>
							올바른 전화번호 형식으로 입력해주세요
						</Text>
					</View>

					<View>
						<Text style={styles.formFieldLabel}>학번</Text>
						<TextField
							height={54}
							style={styles.formInput}
							placeholder="1970-12345"
							keyboardType="number-pad"
							maxLength={10}
							value={adminForm.studentId}
							editable={!isManagerInfoPrefillLoading}
							onChangeText={(text) => {
								setAdminForm((prev) => ({
									...prev,
									studentId: formatStudentIdInput(text, prev.studentId),
								}));
								if (adminFormErrors.studentId) {
									setAdminFormErrors((prev) => ({
										...prev,
										studentId: undefined,
									}));
								}
							}}
						/>
						<Text style={styles.formHelperText}>
							2023-12345 형식으로 입력해주세요
						</Text>
					</View>
				</View>
			</ScrollView>

			<FormNavigationButtons
				onPrevious={handleBack}
				onNext={() => void handleFormNext()}
				nextLabel={
					isManagerRequestEditMode
						? isResubmission
							? "재신청"
							: "수정"
						: "다음"
				}
				isNextDisabled={
					!isFormFieldsValid ||
					isSubmittingRequest ||
					isManagerInfoPrefillLoading ||
					(isManagerRequestEditMode &&
						!isResubmission &&
						!hasManagerInfoChanges)
				}
			/>
			{renderResultModals()}
		</SafeAreaView>
	);

	const renderClubSearch = () => (
		<FlowScreenLayout
			footer={
				<FlowScreenFooter
					backLabel="이전"
					onBack={handleBack}
					rightSlot={<View style={styles.footerSpacer} />}
				/>
			}
		>
			<Text style={styles.title}>
				운영진 권한을 요청할{"\n"}동아리를 선택해주세요
			</Text>

			<View style={styles.searchInputContainer}>
				<TextInput
					style={styles.searchInput}
					placeholder="동아리명을 입력해주세요"
					placeholderTextColor={Colors.BODYTEXT_DISABLED}
					value={clubSearchQuery}
					onChangeText={setClubSearchQuery}
				/>
			</View>

			{searchResults.length > 0 && (
				<View style={styles.searchResultsContainer}>
					{searchResults.map((club) => (
						<TouchableOpacity
							key={club.uuid}
							style={[
								styles.clubResultItem,
								selectedClubId === club.uuid && styles.clubResultItemSelected,
							]}
							onPress={() => handleClubSelect(club.uuid)}
						>
							{club.imageUri ? (
								<Image
									source={{ uri: club.imageUri }}
									style={styles.clubIconPlaceholder}
								/>
							) : (
								<View style={styles.clubIconPlaceholder} />
							)}
							<View style={styles.clubInfo}>
								<Text style={styles.clubName} numberOfLines={1}>
									{club.name}
								</Text>
								<Text style={styles.clubDescription} numberOfLines={2}>
									{getClubSummaryWithAffiliation(club)}
								</Text>
							</View>
							<TouchableOpacity
								style={[
									styles.clubAddButton,
									selectedClubId === club.uuid && styles.clubAddButtonSelected,
									isSubmittingRequest && styles.clubAddButtonDisabled,
								]}
								onPress={() => handleClubAddPress(club)}
								disabled={isSubmittingRequest}
							>
								<Text
									style={[
										styles.clubAddButtonText,
										selectedClubId === club.uuid &&
											styles.clubAddButtonTextSelected,
										isSubmittingRequest && styles.clubAddButtonTextDisabled,
									]}
								>
									+
								</Text>
							</TouchableOpacity>
						</TouchableOpacity>
					))}
				</View>
			)}

			<AlertModal
				visible={isExistingManagerModalVisible}
				onClose={() => setIsExistingManagerModalVisible(false)}
				title="이미 등록된 운영진이 있어요"
				description="동아리당 한 명의 운영진만 등록할 수 있어요"
				buttonLabel="확인"
				onButtonPress={() => setIsExistingManagerModalVisible(false)}
				dismissOnBackdropPress
			/>
			<AlertModal
				visible={isPendingManagerRequestModalVisible}
				onClose={() => setIsPendingManagerRequestModalVisible(false)}
				title="이미 운영진 등록을 신청했어요"
				description="신청이 승인될 때까지 기다려주세요"
				buttonLabel="확인"
				onButtonPress={() => setIsPendingManagerRequestModalVisible(false)}
				dismissOnBackdropPress
			/>
			<AlertModal
				visible={clubPendingRequest !== null}
				onClose={() => setClubPendingRequest(null)}
				title="운영진 권한을 요청하시겠습니까?"
				description="실제 동아리 운영진 확인 후 권한이 부여됩니다."
				buttonLabel="요청"
				onButtonPress={handleClubRequestConfirm}
				hasCancel
				cancelLabel="취소"
				dismissOnBackdropPress
			/>
			{renderResultModals()}
		</FlowScreenLayout>
	);

	return formStep === "form" ? renderForm() : renderClubSearch();
};

export default ManageClubRegistrationScreen;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.WHITE,
	},
	formContent: {
		paddingHorizontal: s(20),
		paddingTop: vs(20),
		paddingBottom: vs(20),
	},
	formHeader: {
		marginBottom: vs(35),
	},
	formTitle: {
		...typography.headerXXL,
		color: Colors.BODYTEXT_MAIN,
	},
	form: {
		gap: vs(20),
	},
	title: {
		fontSize: 25,
		fontWeight: "600",
		color: Colors.BODYTEXT_MAIN,
		lineHeight: 30,
		marginBottom: 15,
	},
	formFieldLabel: {
		...typography.headerXLSemibold,
		color: Colors.BODYTEXT_SUB,
		marginBottom: vs(10),
	},
	formHelperText: {
		...typography.bodyMRegular,
		color: Colors.POINTCOLOR,
		marginTop: vs(5),
	},
	formInput: {
		paddingHorizontal: s(15),
	},
	searchInputContainer: {
		backgroundColor: Colors.BACKGROUND_SUB,
		borderRadius: 10,
		paddingHorizontal: 20,
		paddingVertical: 16,
		height: 49,
		justifyContent: "center",
	},
	searchInput: {
		flex: 1,
		padding: 0,
		fontSize: 14,
		fontWeight: "500",
		color: Colors.BODYTEXT_MAIN,
	},
	searchResultsContainer: {
		marginTop: 20,
		gap: 10,
	},
	clubResultItem: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: Colors.WHITE,
		borderRadius: 10,
		paddingHorizontal: 15,
		paddingVertical: 16,
		borderWidth: 1,
		borderColor: "transparent",
		gap: 10,
		minHeight: 92,
	},
	clubResultItemSelected: {
		borderColor: Colors.POINTCOLOR,
		borderWidth: 2,
	},
	clubIconPlaceholder: {
		width: 60,
		height: 60,
		borderRadius: 8,
		backgroundColor: Colors.BODYTEXT_DISABLED,
		borderWidth: 1,
		borderColor: Colors.BODYTEXT_DISABLED,
		flexShrink: 0,
	},
	clubInfo: {
		flex: 1,
		gap: 4,
	},
	clubName: {
		fontSize: 16,
		fontWeight: "600",
		color: Colors.BODYTEXT_MAIN,
		lineHeight: 19,
	},
	clubDescription: {
		fontSize: 14,
		fontWeight: "400",
		color: Colors.BODYTEXT_SUB,
		lineHeight: 17,
	},
	clubAddButton: {
		width: 24,
		height: 24,
		borderRadius: 12,
		backgroundColor: Colors.BODYTEXT_DISABLED,
		alignItems: "center",
		justifyContent: "center",
		flexShrink: 0,
	},
	clubAddButtonSelected: {
		backgroundColor: Colors.POINTCOLOR,
	},
	clubAddButtonDisabled: {
		opacity: 0.7,
	},
	clubAddButtonText: {
		fontSize: 16,
		fontWeight: "600",
		color: Colors.WHITE,
		lineHeight: 16,
	},
	clubAddButtonTextSelected: {
		color: Colors.WHITE,
	},
	clubAddButtonTextDisabled: {
		opacity: 0.8,
	},
	footerSpacer: {
		width: 128,
		height: 44,
	},
});
