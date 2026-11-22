import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FormNavigationButtons } from "@/features/register-club/components/FormNavigationButtons";
import type { RegisterClubFormData } from "@/features/register-club/types";
import ImageUploadField from "@/shared/components/ImageUploadField";
import TextField from "@/shared/components/TextField";
import { Colors } from "@/shared/constants/colors";
import { typography } from "@/shared/constants/typography";
import type { EditableImage } from "@/shared/types/image";
import { s, vs } from "@/shared/utils/scale";

type Props = {
	formData: RegisterClubFormData;
	onFormDataChange: (data: Partial<RegisterClubFormData>) => void;
	onNext: () => void;
	onPrevious: () => void;
	progress?: number;
};

export const ClubBasicInfoScreen = ({
	formData,
	onFormDataChange,
	onNext,
	onPrevious,
	progress,
}: Props) => {
	const isComplete = formData.clubName.trim();

	const clubImages: EditableImage[] = formData.clubImage
		? [
				{
					id: "club-representative-image",
					uri: formData.clubImage,
					file: formData.clubImageFile ?? undefined,
				},
			]
		: [];

	const handleClubImagesChange = (images: EditableImage[]) => {
		const image = images[0];
		onFormDataChange({
			clubImage: image?.uri ?? null,
			clubImageFile: image?.file ?? null,
		});
	};

	return (
		<SafeAreaView edges={["top", "left", "right"]} style={styles.container}>
			<ScrollView contentContainerStyle={styles.content}>
				<View style={styles.header}>
					<Text style={styles.title}>
						<Text>신규 등록할</Text>
						{"\n"}
						<Text>동아리 기본 정보를 입력해주세요</Text>
					</Text>
				</View>

				<View style={styles.form}>
					<ImageUploadField
						title="동아리 대표 이미지"
						description="4X4 정방형 이미지를 권장드려요"
						images={clubImages}
						onChange={handleClubImagesChange}
						maxCount={1}
						emptyMessage="대표 이미지를 등록해주세요"
						fileNamePrefix="club"
					/>

					<View style={styles.fieldWrapper}>
						<Text style={styles.label}>동아리명</Text>
						<TextField
							placeholder="와플스튜디오"
							value={formData.clubName}
							onChangeText={(text) => onFormDataChange({ clubName: text })}
							maxLength={100}
						/>
						<Text style={styles.validationText}>동아리명을 입력해주세요</Text>
					</View>
				</View>
			</ScrollView>

			<FormNavigationButtons
				onPrevious={onPrevious}
				onNext={onNext}
				isNextDisabled={!isComplete}
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
		padding: s(20),
		paddingBottom: vs(20),
	},
	header: {
		marginBottom: vs(32),
	},
	title: {
		...typography.headerXXL,
		color: Colors.BODYTEXT_MAIN,
	},
	form: {
		gap: vs(28),
	},
	fieldWrapper: {
		gap: vs(8),
	},
	label: {
		...typography.headerXLSemibold,
		color: Colors.BODYTEXT_SUB,
	},
	validationText: {
		...typography.bodyMRegular,
		color: Colors.POINTCOLOR,
	},
});
