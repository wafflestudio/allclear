import React from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from '@/shared/constants/colors'
import { typography } from '@/shared/constants/typography'
import { s, vs } from '@/shared/utils/scale'
import TextField from '@/shared/components/TextField'
import { FormNavigationButtons } from '@/features/register-club/components/FormNavigationButtons'
import { RegisterClubFormData } from '@/features/register-club/types'
import { isValidPhoneNumber, isValidStudentId } from '@/features/register-club/validation'

type Props = {
	formData: RegisterClubFormData
	onFormDataChange: (data: Partial<RegisterClubFormData>) => void
	onNext: () => void
	onPrevious?: () => void
	progress?: number
}

export const ManagerInfoScreen = ({
	formData,
	onFormDataChange,
	onNext,
	onPrevious,
	progress,
}: Props) => {
	const isComplete =
		formData.managerName.trim() !== '' &&
		isValidPhoneNumber(formData.managerPhone) &&
		isValidStudentId(formData.studentId)

	return (
		<SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
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
							onChangeText={text => onFormDataChange({ managerName: text })}
							maxLength={50}
						/>
						<Text style={styles.helperText}>이름을 입력해주세요</Text>
					</View>

					<View style={styles.fieldWrapper}>
						<Text style={styles.label}>전화번호</Text>
						<TextField
							placeholder="01012345678"
							value={formData.managerPhone}
							onChangeText={text => onFormDataChange({ managerPhone: text })}
							keyboardType="phone-pad"
							maxLength={20}
						/>
						<Text style={styles.helperText}>올바른 전화번호 형식으로 입력해주세요</Text>
					</View>

					<View style={styles.fieldWrapper}>
						<Text style={styles.label}>학번</Text>
						<TextField
							placeholder="1970-12345"
							value={formData.studentId}
							onChangeText={text => onFormDataChange({ studentId: text })}
							keyboardType="numeric"
							maxLength={20}
						/>
						<Text style={styles.helperText}>2023-12345 형식으로 입력해주세요</Text>
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
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.WHITE,
	},
	content: {
		padding: s(20),
		paddingBottom: vs(20),
		gap: vs(32),
	},
	header: {
		marginBottom: vs(32),
	},
	title: {
		...typography.headerXXL,
		color: Colors.BODYTEXT_MAIN,
	},
	form: {
		gap: vs(24),
	},
	fieldWrapper: {
		gap: vs(4),
	},
	label: {
		...typography.headerXLSemibold,
		color: Colors.BODYTEXT_SUB,
		marginBottom: vs(4),
	},
	helperText: {
		...typography.bodyMRegular,
		color: Colors.POINTCOLOR,
		marginTop: vs(4),
	},
})
