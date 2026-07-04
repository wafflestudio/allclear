import React, { useState } from 'react'
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from '@/shared/constants/colors'
import { typography } from '@/shared/constants/typography'
import { s, vs } from '@/shared/utils/scale'
import { FormNavigationButtons } from '@/features/register-club/components/FormNavigationButtons'
import { RegisterClubFormData } from '@/features/register-club/types'
import { isValidUrl } from '@/features/register-club/validation'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'

const RECRUIT_TYPES = ['정기', '상시', '미정']

type Props = {
	formData: RegisterClubFormData
	onFormDataChange: (data: Partial<RegisterClubFormData>) => void
	onComplete: () => void
	onPrevious: () => void
	isLoading?: boolean
	progress?: number
}

export const ClubDetailsScreen = ({
	formData,
	onFormDataChange,
	onComplete,
	onPrevious,
	isLoading = false,
	progress,
}: Props) => {
	const [activityCycleMode, setActivityCycleMode] = useState<'none' | 'number'>(
		formData.activityCycle ? 'number' : 'none',
	)

	const activitySemesters = parseInt(formData.activityCycle, 10) || 0

	const setHasDongbang = (value: boolean) => {
		onFormDataChange(value ? { hasDongbang: true } : { hasDongbang: false, dongbangLocation: '' })
	}

	const handleActivityCycleModeChange = (mode: 'none' | 'number') => {
		setActivityCycleMode(mode)
		if (mode === 'none') {
			onFormDataChange({ activityCycle: '' })
		}
	}

	const incrementActivityCycle = () => {
		setActivityCycleMode('number')
		onFormDataChange({ activityCycle: (activitySemesters + 1).toString() })
	}

	const decrementActivityCycle = () => {
		if (activitySemesters > 0) {
			onFormDataChange({ activityCycle: (activitySemesters - 1).toString() })
		}
	}

	const isComplete =
		formData.recruitType.trim() &&
		isValidUrl(formData.clubSNS) &&
		formData.clubDescription.trim() &&
		(activityCycleMode === 'none' || formData.activityCycle.trim())

	return (
		<SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
			<ScrollView contentContainerStyle={styles.content}>
				<View style={styles.header}>
					<Text style={styles.title}>
						<Text style={styles.clubName}>{formData.clubName}</Text>
						<Text>의</Text>
						{'\n'}
						<Text>세부정보를 입력해주세요</Text>
					</Text>
					<Text style={styles.subtitle}>관리하기 탭에서 언제든 수정할 수 있어요</Text>
				</View>

				<View style={styles.form}>
					{/* Recruitment Type */}
					<View style={styles.fieldWrapper}>
						<Text style={styles.fieldLabel}>모집 형태</Text>
						<View style={styles.buttonGroup}>
							{RECRUIT_TYPES.map(type => (
								<Pressable
									key={type}
									style={[
										styles.typeButton,
										formData.recruitType === type && styles.typeButtonSelected,
									]}
									onPress={() => onFormDataChange({ recruitType: type })}>
									<Text
										style={[
											styles.typeButtonText,
											formData.recruitType === type && styles.typeButtonTextSelected,
										]}>
										{type}
									</Text>
								</Pressable>
							))}
						</View>
						<Text style={styles.validationText}>모집 형태를 선택해주세요</Text>
					</View>

					{/* Activity Period */}
					<View style={styles.fieldWrapper}>
						<Text style={styles.fieldLabel}>(최소) 활동 기간</Text>
						<View style={styles.periodRow}>
							<View style={styles.modeButtons}>
								<Pressable
									style={[
										styles.typeButton,
										activityCycleMode === 'none' && styles.typeButtonSelected,
									]}
									onPress={() => handleActivityCycleModeChange('none')}>
									<Text
										style={[
											styles.typeButtonText,
											activityCycleMode === 'none' && styles.typeButtonTextSelected,
										]}>
										없음
									</Text>
								</Pressable>
								<Pressable
									style={[
										styles.typeButton,
										activityCycleMode === 'number' && styles.typeButtonSelected,
									]}
									onPress={() => handleActivityCycleModeChange('number')}>
									<Text
										style={[
											styles.typeButtonText,
											activityCycleMode === 'number' && styles.typeButtonTextSelected,
										]}>
										있음
									</Text>
								</Pressable>
							</View>

							<View style={styles.periodStepper}>
								<Text style={styles.semesterValue}>{activitySemesters}학기</Text>
								<View style={styles.stepperPill}>
									<Pressable style={styles.stepperButton} onPress={decrementActivityCycle}>
										<MaterialIcons name="remove" size={18} color={Colors.BODYTEXT_SUB} />
									</Pressable>
									<View style={styles.stepperDivider} />
									<Pressable style={styles.stepperButton} onPress={incrementActivityCycle}>
										<MaterialIcons name="add" size={18} color={Colors.BODYTEXT_SUB} />
									</Pressable>
								</View>
							</View>
						</View>
					</View>

					{/* Dongbang */}
					<View style={styles.fieldWrapper}>
						<Text style={styles.fieldLabel}>동방 보유 여부</Text>
						<View style={styles.buttonGroup}>
							<Pressable
								style={[styles.typeButton, formData.hasDongbang && styles.typeButtonSelected]}
								onPress={() => setHasDongbang(true)}>
								<Text
									style={[
										styles.typeButtonText,
										formData.hasDongbang && styles.typeButtonTextSelected,
									]}>
									보유
								</Text>
							</Pressable>
							<Pressable
								style={[styles.typeButton, !formData.hasDongbang && styles.typeButtonSelected]}
								onPress={() => setHasDongbang(false)}>
								<Text
									style={[
										styles.typeButtonText,
										!formData.hasDongbang && styles.typeButtonTextSelected,
									]}>
									미보유
								</Text>
							</Pressable>
						</View>

						{formData.hasDongbang && (
							<View style={styles.iconInputRow}>
								<MaterialIcons name="location-on" size={20} color={Colors.BODYTEXT_DISABLED} />
								<TextInput
									style={styles.iconInput}
									placeholder="활동 장소를 입력하세요"
									placeholderTextColor={Colors.BODYTEXT_DISABLED}
									value={formData.dongbangLocation}
									onChangeText={text => onFormDataChange({ dongbangLocation: text })}
									maxLength={100}
								/>
							</View>
						)}
						<Text style={styles.validationText}>동방 보유 여부를 알려주세요</Text>
					</View>

					{/* SNS */}
					<View style={styles.fieldWrapper}>
						<Text style={styles.fieldLabel}>동아리 SNS</Text>
						<View style={styles.iconInputRow}>
							<MaterialIcons name="link" size={20} color={Colors.BODYTEXT_DISABLED} />
							<TextInput
								style={styles.iconInput}
								placeholder="url을 입력하세요"
								placeholderTextColor={Colors.BODYTEXT_DISABLED}
								value={formData.clubSNS}
								onChangeText={text => onFormDataChange({ clubSNS: text })}
								autoCapitalize="none"
								keyboardType="url"
								maxLength={200}
							/>
						</View>
						<Text style={styles.validationText}>동아리 SNS 링크를 입력해주세요</Text>
					</View>

					{/* Description */}
					<View style={styles.fieldWrapper}>
						<Text style={styles.fieldLabel}>동아리 추가 설명</Text>
						<TextInput
							style={styles.descriptionInput}
							placeholder="동아리에 대해 자세히 설명해주세요"
							placeholderTextColor={Colors.BODYTEXT_DISABLED}
							value={formData.clubDescription}
							onChangeText={text => onFormDataChange({ clubDescription: text })}
							maxLength={500}
						/>
						<Text style={styles.validationText}>동아리 추가 설명은 필수 입력 정보예요.</Text>
					</View>
				</View>
			</ScrollView>

			<FormNavigationButtons
				onPrevious={onPrevious}
				onNext={onComplete}
				isNextDisabled={!isComplete || isLoading}
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
		gap: vs(24),
	},
	fieldWrapper: {
		gap: vs(8),
	},
	fieldLabel: {
		...typography.headerXLSemibold,
		color: Colors.BODYTEXT_SUB,
	},
	buttonGroup: {
		flexDirection: 'row',
		gap: s(8),
	},
	typeButton: {
		flex: 1,
		paddingVertical: vs(14),
		paddingHorizontal: s(12),
		borderRadius: 12,
		borderWidth: 1,
		borderColor: Colors.BODYTEXT_DISABLED,
		backgroundColor: Colors.WHITE,
		alignItems: 'center',
	},
	typeButtonSelected: {
		backgroundColor: Colors.BUTTON_SELECTED,
		borderColor: Colors.BUTTON_SELECTED,
	},
	typeButtonText: {
		...typography.bodyMMedium,
		color: Colors.BODYTEXT_DISABLED,
	},
	typeButtonTextSelected: {
		color: Colors.WHITE,
		fontWeight: '600',
	},
	periodRow: {
		flexDirection: 'row',
		alignItems: 'flex-end',
		gap: s(16),
	},
	modeButtons: {
		flex: 1,
		flexDirection: 'row',
		gap: s(8),
	},
	periodStepper: {
		alignItems: 'center',
		gap: vs(6),
	},
	semesterValue: {
		...typography.headerL,
		color: Colors.BODYTEXT_MAIN,
	},
	stepperPill: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: 8,
		backgroundColor: Colors.BACKGROUND_SUB,
	},
	stepperButton: {
		paddingHorizontal: s(16),
		paddingVertical: vs(8),
		justifyContent: 'center',
		alignItems: 'center',
	},
	stepperDivider: {
		width: 1,
		height: vs(16),
		backgroundColor: Colors.BODYTEXT_DISABLED,
	},
	iconInputRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: s(8),
	},
	iconInput: {
		flex: 1,
		...typography.bodyMRegular,
		color: Colors.BODYTEXT_MAIN,
		paddingHorizontal: s(16),
		paddingVertical: vs(8),
		borderWidth: 1,
		borderColor: Colors.BODYTEXT_DISABLED,
		borderRadius: 8,
		backgroundColor: Colors.WHITE,
	},
	descriptionInput: {
		...typography.bodyMRegular,
		color: Colors.BODYTEXT_MAIN,
		paddingHorizontal: s(16),
		paddingVertical: vs(8),
		borderWidth: 1,
		borderColor: Colors.BODYTEXT_DISABLED,
		borderRadius: 8,
		backgroundColor: Colors.WHITE,
	},
	validationText: {
		...typography.bodyMRegular,
		color: Colors.POINTCOLOR,
	},
})
