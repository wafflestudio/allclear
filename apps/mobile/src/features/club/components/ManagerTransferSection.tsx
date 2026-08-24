import { useMutation } from "@tanstack/react-query";
import { useContext, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import {
	copyManagerTransferLink,
	getManagerTransferErrorContent,
} from "@/features/club/utils/managerTransfer";
import type { ClubManager } from "@/repositories/club";
import AlertModal from "@/shared/components/AlertModal";
import { Colors } from "@/shared/constants/colors";
import { serviceContext } from "@/shared/contexts/serviceContext";
import { ms, s, vs } from "@/shared/utils/scale";

type ManagerTransferPhase = "idle" | "confirm" | "copied";

type Props = {
	clubId: string;
	clubName: string;
	managers: ClubManager[];
};

const ManagerTransferSection = ({ clubId, clubName, managers }: Props) => {
	const { clubService } = useContext(serviceContext);
	const [phase, setPhase] = useState<ManagerTransferPhase>("idle");
	const { mutate: createInvitation, isPending } = useMutation({
		mutationFn: () => clubService.createManagerTransferInvitation({ clubId }),
		onSuccess: ({ transferUrl }) => {
			copyManagerTransferLink(transferUrl);
			setPhase("copied");
		},
		onError: (error) => {
			const content = getManagerTransferErrorContent(error);
			setPhase("idle");
			Toast.show({
				type: "error",
				text1: content.title,
				text2: content.description,
			});
		},
	});

	return (
		<View style={styles.section}>
			<View style={styles.sectionLabel}>
				<Text style={styles.sectionLabelText}>운영진 목록</Text>
			</View>
			<View style={styles.listContainer}>
				{managers.length === 0 ? (
					<View style={styles.managerRow}>
						<Text style={styles.emptyText}>등록된 운영진이 없어요</Text>
					</View>
				) : (
					managers.map((manager, index) => (
						<View key={manager.serviceUserId} style={styles.managerRow}>
							<View style={styles.managerIdentity}>
								<Text style={styles.managerName}>{manager.name}</Text>
								{!!manager.studentId && (
									<Text style={styles.managerStudentId}>
										{manager.studentId}
									</Text>
								)}
							</View>
							{index === 0 && (
								<Pressable
									accessibilityRole="button"
									accessibilityLabel={`${clubName} 관리자 권한 이전`}
									style={({ pressed }) => [
										styles.transferButton,
										pressed && styles.transferButtonPressed,
									]}
									onPress={() => setPhase("confirm")}
								>
									<Text style={styles.transferButtonText}>
										관리자 권한 이전
									</Text>
								</Pressable>
							)}
						</View>
					))
				)}
			</View>

			<AlertModal
				visible={phase === "confirm"}
				onClose={() => !isPending && setPhase("idle")}
				title={`‘${clubName}’ 동아리의\n관리자 권한을 이전하시겠어요?`}
				description={
					"아래 버튼을 통해 링크를 복사하고, 관리자 권한을\n이전할 상대에게 보내주세요. 상대가 링크를 통해\n앱에 접속하면 관리자 권한이 이전돼요."
				}
				buttonLabel={isPending ? "링크 만드는 중..." : "링크 복사"}
				onButtonPress={() => createInvitation()}
				buttonDisabled={isPending}
				hasCancel
				dismissOnBackdropPress={!isPending}
			/>

			<AlertModal
				visible={phase === "copied"}
				onClose={() => setPhase("idle")}
				title="링크 복사 완료!"
				description="관리자 권한을 이전할 상대에게\n링크를 보내주세요"
				buttonLabel="확인"
				onButtonPress={() => setPhase("idle")}
			/>
		</View>
	);
};

export default ManagerTransferSection;

const styles = StyleSheet.create({
	section: { gap: 0 },
	sectionLabel: {
		height: vs(34),
		justifyContent: "center",
		paddingHorizontal: s(5),
	},
	sectionLabelText: {
		fontFamily: "Pretendard-Medium",
		fontSize: ms(14),
		color: Colors.BODYTEXT_SUB,
	},
	listContainer: { gap: vs(10) },
	managerRow: {
		minHeight: vs(58),
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		backgroundColor: Colors.WHITE,
		borderRadius: ms(12),
		paddingHorizontal: s(15),
		paddingVertical: vs(10),
	},
	emptyText: {
		flex: 1,
		textAlign: "center",
		fontFamily: "Pretendard-Medium",
		fontSize: ms(12),
		color: Colors.BODYTEXT_SUB,
	},
	managerIdentity: { flex: 1, gap: vs(3) },
	managerName: {
		fontFamily: "Pretendard-SemiBold",
		fontSize: ms(13),
		color: Colors.BODYTEXT_MAIN,
	},
	managerStudentId: {
		fontFamily: "Pretendard-Regular",
		fontSize: ms(12),
		color: Colors.BODYTEXT_SUB,
	},
	transferButton: {
		backgroundColor: Colors.POINTCOLOR,
		borderRadius: ms(12),
		paddingHorizontal: s(12),
		paddingVertical: vs(8),
	},
	transferButtonPressed: { backgroundColor: Colors.BUTTON_PUSH },
	transferButtonText: {
		fontFamily: "Pretendard-SemiBold",
		fontSize: ms(10),
		color: Colors.WHITE,
	},
});
