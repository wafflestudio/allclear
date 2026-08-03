import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FormNavigationButtons } from "@/features/register-club/components/FormNavigationButtons";
import type { RegisterClubFormData } from "@/features/register-club/types";
import {
	isValidPhoneNumber,
	isValidStudentId,
} from "@/features/register-club/validation";
import TextField from "@/shared/components/TextField";
import { Colors } from "@/shared/constants/colors";
import { typography } from "@/shared/constants/typography";
import {
	formatPhoneNumberInput,
	formatStudentIdInput,
} from "@/shared/utils/managerInfo";
import { s, vs } from "@/shared/utils/scale";

type Props = {
	formData: RegisterClubFormData;
	onFormDataChange: (data: Partial<RegisterClubFormData>) => void;
	onNext: () => void;
	onPrevious?: () => void;
	progress?: number;
};

export const ManagerInfoScreen = ({
	formData,
	onFormDataChange,
	onNext,
	onPrevious,
	progress,
}: Props) => {
	const isComplete =
		formData.managerName.trim() !== "" &&
		isValidPhoneNumber(formData.managerPhone) &&
		isValidStudentId(formData.studentId);

	return (
		<SafeAreaView edges={["top", "left", "right"]} style={styles.container}>
			<ScrollView contentContainerStyle={styles.content}>
				<View style={styles.header}>
					<Text style={styles.title}>운영진 기본 정보를</Text>
					<Text style={styles.title}>입력해주세요</Text>
				</View>

				<View style={styles.form}>
					<View style={styles.fieldWrapper}>
						<Text style={styles.label}>이름</Text>
						<TextField
							placeholder="홍길동"
							value={formData.managerName}
							onChangeText={(text) => onFormDataChange({ managerName: text })}
							maxLength={50}
						/>
						<Text style={styles.helperText}>이름을 입력해주세요</Text>
					</View>

					<View style={styles.fieldWrapper}>
						<Text style={styles.label}>전화번호</Text>
						<TextField
							placeholder="010-1234-5678"
							value={formData.managerPhone}
							onChangeText={(text) =>
								onFormDataChange({
									managerPhone: formatPhoneNumberInput(
										text,
										formData.managerPhone,
									),
								})
							}
							keyboardType="number-pad"
							maxLength={13}
						/>
						<Text style={styles.helperText}>
							올바른 전화번호 형식으로 입력해주세요
						</Text>
					</View>

					<View style={styles.fieldWrapper}>
						<Text style={styles.label}>학번</Text>
						<TextField
							placeholder="1970-12345"
							value={formData.studentId}
							onChangeText={(text) =>
								onFormDataChange({
									studentId: formatStudentIdInput(text, formData.studentId),
								})
							}
							keyboardType="number-pad"
							maxLength={10}
						/>
						<Text style={styles.helperText}>
							2023-12345 형식으로 입력해주세요
						</Text>
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
		paddingHorizontal: s(20),
		paddingTop: vs(20),
		paddingBottom: vs(20),
	},
	header: {
		marginBottom: vs(20),
	},
	title: {
		...typography.headerXXL,
		color: Colors.BODYTEXT_MAIN,
	},
	form: {
		gap: vs(20),
	},
	fieldWrapper: {},
	label: {
		...typography.headerXLSemibold,
		color: Colors.BODYTEXT_SUB,
		marginBottom: vs(10),
	},
	helperText: {
		...typography.bodyMRegular,
		color: Colors.POINTCOLOR,
		marginTop: vs(5),
	},
});
