import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FormNavigationButtons } from "@/features/register-club/components/FormNavigationButtons";
import { NoticeCard } from "@/features/register-club/components/NoticeCard";
import ImageUploadField from "@/shared/components/ImageUploadField";
import { Colors } from "@/shared/constants/colors";
import { typography } from "@/shared/constants/typography";
import type { EditableImage } from "@/shared/types/image";
import { s, vs } from "@/shared/utils/scale";

type Props = {
	clubName: string;
	evidenceImages: EditableImage[];
	onEvidenceImagesChange: (images: EditableImage[]) => void;
	onNext: () => void;
	onPrevious: () => void;
	progress?: number;
};

export const EvidenceInfoScreen = ({
	clubName,
	evidenceImages,
	onEvidenceImagesChange,
	onNext,
	onPrevious,
	progress,
}: Props) => {
	return (
		<SafeAreaView edges={["top", "left", "right"]} style={styles.container}>
			<ScrollView contentContainerStyle={styles.content}>
				<Text style={styles.title}>
					<Text style={styles.clubName}>{clubName}</Text>의{"\n"}
					증빙자료를 첨부해 주세요
				</Text>
				<Text style={styles.subtitle}>
					신청하신 동아리의 운영진임을{"\n"}
					확인할 수 있는 자료를 첨부해주세요.
				</Text>

				<View style={styles.notice}>
					<NoticeCard
						title="제출 가능한 예시"
						style={{ paddingHorizontal: s(20) }}
					>
						<Text>
							동아리 <Text style={styles.noticeStrong}>인스타그램 계정</Text>{" "}
							로그인된 화면{"\n"}
							<Text style={styles.noticeStrong}>공식 홈페이지, 노션</Text> 등의
							관리자 화면
							{"\n"}
							동아리 운영진{" "}
							<Text style={styles.noticeStrong}>카카오톡·디스코드·슬랙</Text> 등
							채널화면{"\n"}
							모집글에 기재된 연락처가 신청자 정보와 일치하는 경우{"\n"}그 외
							<Text style={styles.noticeStrong}>
								{" "}
								운영진임을 확인할 수 있는
							</Text>{" "}
							사진, 스크린샷
						</Text>
					</NoticeCard>
				</View>

				<View style={styles.uploadField}>
					<ImageUploadField
						images={evidenceImages}
						onChange={onEvidenceImagesChange}
						maxCount={5}
						showCount={false}
						tileSize={120}
						fileNamePrefix="club_evidence"
						footerMessage="최대 5장까지 추가 가능합니다."
					/>
				</View>
			</ScrollView>
			<FormNavigationButtons
				onPrevious={onPrevious}
				onNext={onNext}
				isNextDisabled={evidenceImages.length === 0}
				progress={progress}
			/>
		</SafeAreaView>
	);
};

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
	notice: {
		marginTop: vs(28),
	},
	subtitle: {
		...typography.bodyMRegular,
		color: Colors.BODYTEXT_SUB,
	},
	noticeStrong: {
		fontFamily: "Pretendard-SemiBold",
	},
	uploadField: {
		marginTop: vs(16),
	},
});
