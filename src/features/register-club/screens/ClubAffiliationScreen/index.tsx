import React, { useState } from 'react'
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import { Colors } from '@/shared/constants/colors'
import { typography } from '@/shared/constants/typography'
import { s, vs } from '@/shared/utils/scale'
import TextField from '@/shared/components/TextField'
import { FormNavigationButtons } from '@/features/register-club/components/FormNavigationButtons'
import { RegisterClubFormData } from '@/features/register-club/types'

const DEPARTMENTS = [
	'중앙동아리',
	'인문대학',
	'국어국문학과',
	'중어중문학과',
	'영어영문학과',
	'공과대학',
	'컴퓨터공학과',
	'기계공학과',
]

type Props = {
	formData: RegisterClubFormData
	onFormDataChange: (data: Partial<RegisterClubFormData>) => void
	onNext: () => void
	onPrevious: () => void
	progress?: number
}

export const ClubAffiliationScreen = ({
	formData,
	onFormDataChange,
	onNext,
	onPrevious,
	progress,
}: Props) => {
	const [showDropdown, setShowDropdown] = useState(false)
	const isComplete = formData.department.trim() && formData.shortIntro.trim()

	const handleSelectDepartment = (dept: string) => {
		onFormDataChange({ department: dept })
		setShowDropdown(false)
	}

	return (
		<SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
			<ScrollView contentContainerStyle={styles.content}>
				<View style={styles.header}>
					<Text style={styles.title}>
						<Text style={styles.clubName}>{formData.clubName}</Text>
						<Text>의</Text>
						{'\n'}
						<Text>한줄소개를 완성해주세요</Text>
					</Text>
					<Text style={styles.subtitle}>동아리 소개 최상단에 노출될 간단한 문구예요</Text>
				</View>

				<View style={styles.form}>
					{/* Department Dropdown + 소속 label */}
					<View style={styles.affiliationRow}>
						<Pressable
							style={[styles.dropdown, showDropdown && styles.dropdownActive]}
							onPress={() => setShowDropdown(!showDropdown)}>
							<Text style={styles.dropdownText}>{formData.department || '단과대/학과'}</Text>
							<MaterialIcons
								name={showDropdown ? 'expand-less' : 'expand-more'}
								size={20}
								color={Colors.BODYTEXT_MAIN}
							/>
						</Pressable>
						<Text style={styles.affiliationLabel}>소속</Text>
					</View>

					{showDropdown && (
						<View style={styles.dropdownMenu}>
							{DEPARTMENTS.map(dept => (
								<Pressable
									key={dept}
									style={[
										styles.dropdownItem,
										formData.department === dept && styles.dropdownItemSelected,
									]}
									onPress={() => handleSelectDepartment(dept)}>
									<Text
										style={[
											styles.dropdownItemText,
											formData.department === dept && styles.dropdownItemTextSelected,
										]}>
										{dept}
									</Text>
								</Pressable>
							))}
						</View>
					)}

					{/* Short Introduction Input */}
					<TextField
						placeholder="웹/앱 개발 동아리, 경영전략학회"
						value={formData.shortIntro}
						onChangeText={text => onFormDataChange({ shortIntro: text })}
						maxLength={100}
					/>

					<View style={styles.validationGroup}>
						<Text style={styles.validationText}>소속을 선택해주세요</Text>
						<Text style={styles.validationText}>동아리 주요 활동을 작성해주세요</Text>
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
	},
	header: {
		marginBottom: vs(32),
	},
	title: {
		...typography.headerXXL,
		color: Colors.BODYTEXT_MAIN,
		marginBottom: vs(8),
	},
	clubName: {
		color: Colors.BUTTON_SELECTED,
		fontWeight: '800',
	},
	subtitle: {
		...typography.bodyMRegular,
		color: Colors.BODYTEXT_SUB,
	},
	form: {
		gap: vs(12),
	},
	affiliationRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: s(16),
	},
	affiliationLabel: {
		...typography.headerXLSemibold,
		color: Colors.BODYTEXT_MAIN,
	},
	dropdown: {
		width: '55%',
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: s(16),
		paddingVertical: vs(14),
		borderWidth: 1,
		borderColor: Colors.BODYTEXT_DISABLED,
		borderRadius: 8,
		backgroundColor: Colors.WHITE,
	},
	dropdownActive: {
		borderColor: Colors.BUTTON_SELECTED,
	},
	dropdownText: {
		...typography.bodyMRegular,
		color: Colors.BODYTEXT_SUB,
		flex: 1,
	},
	dropdownMenu: {
		width: '55%',
		borderWidth: 1,
		borderColor: Colors.BODYTEXT_DISABLED,
		borderRadius: 8,
		backgroundColor: Colors.WHITE,
	},
	dropdownItem: {
		paddingHorizontal: s(16),
		paddingVertical: vs(12),
		borderBottomWidth: 1,
		borderBottomColor: Colors.BACKGROUND_SUB,
	},
	dropdownItemSelected: {
		backgroundColor: Colors.BACKGROUND_SUB,
	},
	dropdownItemText: {
		...typography.bodyMRegular,
		color: Colors.BODYTEXT_MAIN,
	},
	dropdownItemTextSelected: {
		color: Colors.BUTTON_SELECTED,
		fontWeight: '600',
	},
	validationGroup: {
		gap: vs(8),
	},
	validationText: {
		...typography.bodyMRegular,
		color: Colors.POINTCOLOR,
	},
})
