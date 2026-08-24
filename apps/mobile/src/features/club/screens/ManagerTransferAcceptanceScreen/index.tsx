import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext, useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
	getManagerTransferErrorAction,
	getManagerTransferErrorContent,
} from "@/features/club/utils/managerTransfer";
import AlertModal from "@/shared/components/AlertModal";
import BackHeader from "@/shared/components/BackHeader";
import Button from "@/shared/components/Button";
import { Colors } from "@/shared/constants/colors";
import type {
	RootStackParamList,
	SCREEN_TYPE,
} from "@/shared/constants/screen";
import { typography } from "@/shared/constants/typography";
import { useLoginBottomSheet } from "@/shared/contexts/loginBottomSheetContext";
import { useProfile } from "@/shared/contexts/profileContext";
import { serviceContext } from "@/shared/contexts/serviceContext";
import { ms, s, vs } from "@/shared/utils/scale";

type ScreenProps = NativeStackScreenProps<
	RootStackParamList,
	SCREEN_TYPE.MANAGER_TRANSFER_ACCEPTANCE
>;

const ManagerTransferAcceptanceScreen = ({
	route,
	navigation,
}: ScreenProps) => {
	const { token } = route.params;
	const { clubService } = useContext(serviceContext);
	const { user, isLoading: isProfileLoading } = useProfile();
	const { openBottomSheet } = useLoginBottomSheet();
	const queryClient = useQueryClient();
	const hasPromptedLogin = useRef(false);
	const [acceptedClubName, setAcceptedClubName] = useState<string | null>(null);
	const [acceptanceError, setAcceptanceError] = useState<unknown>(null);

	useEffect(() => {
		if (isProfileLoading || user || hasPromptedLogin.current) return;
		hasPromptedLogin.current = true;
		openBottomSheet();
	}, [isProfileLoading, openBottomSheet, user]);

	const invitationQuery = useQuery({
		queryKey: ["managerTransferInvitation", token],
		queryFn: () => clubService.getManagerTransferInvitation({ token }),
		enabled: !!user,
		retry: false,
	});

	const acceptanceMutation = useMutation({
		mutationFn: () => clubService.acceptManagerTransferInvitation({ token }),
		onSuccess: ({ clubName }) => {
			setAcceptedClubName(clubName);
			setAcceptanceError(null);
			queryClient.invalidateQueries({ queryKey: ["manageClubs"] });
			queryClient.invalidateQueries({ queryKey: ["userNotifications"] });
		},
		onError: setAcceptanceError,
	});

	const error = invitationQuery.error ?? acceptanceError;
	const errorContent = error
		? getManagerTransferErrorContent(error)
		: undefined;
	const errorAction = error ? getManagerTransferErrorAction(error) : undefined;

	const leaveTransferFlow = () => navigation.replace("Main");
	const handleErrorClose = () => {
		if (acceptanceError && errorAction === "retry") {
			setAcceptanceError(null);
			return;
		}
		leaveTransferFlow();
	};
	const handleErrorAction = () => {
		if (errorAction === "exit") {
			leaveTransferFlow();
			return;
		}
		if (acceptanceError) {
			setAcceptanceError(null);
			return;
		}
		invitationQuery.refetch();
	};

	const isLoading = isProfileLoading || (!!user && invitationQuery.isLoading);
	const invitation = invitationQuery.data;

	return (
		<SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
			<BackHeader title="관리자 권한 이전" onBack={leaveTransferFlow} />
			<View style={styles.content}>
				{isLoading ? (
					<ActivityIndicator color={Colors.POINTCOLOR} size="large" />
				) : !user ? (
					<View style={styles.loginCard}>
						<Text style={styles.title}>로그인 후 권한을 받을 수 있어요</Text>
						<Text style={styles.description}>
							링크를 받은 계정으로 로그인해주세요.{"\n"}
							로그인하면 이 화면에서 이어서 진행돼요.
						</Text>
						<Button
							label="로그인하고 권한 받기"
							onPress={() => openBottomSheet()}
							style={styles.loginButton}
						/>
					</View>
				) : (
					<View style={styles.placeholder}>
						<Text style={styles.description}>
							관리자 권한 이전 요청을 확인하고 있어요.
						</Text>
					</View>
				)}
			</View>

			<AlertModal
				visible={!!invitation && !acceptedClubName && !error}
				onClose={leaveTransferFlow}
				title="관리자 권한을 받았어요"
				description={`‘${invitation?.clubName ?? ""}’ 동아리의\n관리자 권한을 받으시겠어요?`}
				buttonLabel={
					acceptanceMutation.isPending ? "권한 받는 중..." : "권한 받기"
				}
				onButtonPress={() => acceptanceMutation.mutate()}
				buttonDisabled={acceptanceMutation.isPending}
				hasCancel
				dismissOnBackdropPress={!acceptanceMutation.isPending}
			/>

			<AlertModal
				visible={!!acceptedClubName}
				onClose={leaveTransferFlow}
				title="권한 받기 성공!"
				description={`‘${acceptedClubName ?? ""}’ 동아리의 관리자 권한을 받았어요.\n기존 관리자에게도 권한 이전 완료 알림을 보냈어요.`}
				buttonLabel="확인"
				onButtonPress={leaveTransferFlow}
				dismissOnBackdropPress={false}
			/>

			<AlertModal
				visible={!!error && !!errorContent}
				onClose={handleErrorClose}
				title={errorContent?.title ?? ""}
				description={errorContent?.description}
				buttonLabel={errorAction === "retry" ? "다시 시도" : "확인"}
				onButtonPress={handleErrorAction}
				dismissOnBackdropPress={false}
			/>
		</SafeAreaView>
	);
};

export default ManagerTransferAcceptanceScreen;

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: Colors.BACKGROUND_SUB,
	},
	content: {
		flex: 1,
		justifyContent: "center",
		paddingHorizontal: s(24),
		paddingBottom: vs(56),
	},
	loginCard: {
		backgroundColor: Colors.WHITE,
		borderRadius: ms(16),
		paddingHorizontal: s(24),
		paddingVertical: vs(28),
		alignItems: "center",
	},
	title: {
		...typography.headerL,
		color: Colors.BODYTEXT_MAIN,
		textAlign: "center",
	},
	description: {
		...typography.bodyMRegular,
		color: Colors.BODYTEXT_SUB,
		textAlign: "center",
		marginTop: vs(12),
		lineHeight: ms(22),
	},
	loginButton: {
		marginTop: vs(24),
		width: "100%",
	},
	placeholder: {
		alignItems: "center",
	},
});
