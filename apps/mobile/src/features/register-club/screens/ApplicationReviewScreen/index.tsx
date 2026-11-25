import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApplicationSummaryCard } from "@/features/register-club/components/ApplicationSummaryCard";
import { FormNavigationButtons } from "@/features/register-club/components/FormNavigationButtons";
import { NoticeCard } from "@/features/register-club/components/NoticeCard";
import type { RegisterClubFormData } from "@/features/register-club/types";
import type { RegisterClubFocusTarget } from "@/features/register-club/types/focus";
import { Colors } from "@/shared/constants/colors";
import { typography } from "@/shared/constants/typography";
import type { EditableImage } from "@/shared/types/image";
import { s, vs } from "@/shared/utils/scale";

type Props = {
	formData: RegisterClubFormData;
	evidenceImages: EditableImage[];
	onNext: () => void;
	onPrevious: () => void;
	onEdit: (target: RegisterClubFocusTarget) => void;
	progress?: number;
};

export const ApplicationReviewScreen = ({
	formData,
	evidenceImages,
	onNext,
	onPrevious,
	onEdit,
	progress,
}: Props) => (
	<SafeAreaView edges={["top", "left", "right"]} style={styles.container}>
		<ScrollView contentContainerStyle={styles.content}>
			<Text style={styles.title}>
				<Text style={styles.clubName}>{formData.clubName}</Text>의{"\n"}
				신청 내용을 확인해주세요
			</Text>
			<Text style={styles.subtitle}>
				입력한 내용과 증빙자료를 마지막으로 확인해주세요.
			</Text>
			<View style={styles.summary}>
				<ApplicationSummaryCard
					formData={formData}
					evidenceImages={evidenceImages}
					onEdit={onEdit}
				/>
			</View>
			<View style={styles.notice}>
				<NoticeCard>
					신청이 접수되면 검토 후 결과를 안내해드려요.{"\n"}
					진행 상황은 마이 → 동아리 운영진에서 확인할 수 있어요.
				</NoticeCard>
			</View>
		</ScrollView>
		<FormNavigationButtons
			onPrevious={onPrevious}
			onNext={onNext}
			nextLabel="신청하기"
			progress={progress}
		/>
	</SafeAreaView>
);

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.WHITE,
	},
	content: {
		paddingHorizontal: s(20),
		paddingTop: vs(20),
		paddingBottom: vs(24),
	},
	title: {
		...typography.headerXXL,
		color: Colors.BODYTEXT_MAIN,
		marginBottom: vs(8),
	},
	clubName: {
		color: Colors.POINTCOLOR,
	},
	subtitle: {
		...typography.bodyMRegular,
		color: Colors.BODYTEXT_SUB,
	},
	notice: {
		marginTop: vs(16),
	},
	summary: {
		marginTop: vs(16),
	},
});
