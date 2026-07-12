import React, { useContext, useEffect, useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import AlertModal from '@/shared/components/AlertModal'
import FlowScreenFooter from '@/shared/components/FlowScreenFooter'
import FlowScreenLayout from '@/shared/components/FlowScreenLayout'
import { Colors } from '@/shared/constants/colors'
import { navigation } from '@/shared/utils/navigation'
import { Club } from '@/entities/club'
import { serviceContext } from '@/shared/contexts/serviceContext'

type AdminFormData = {
	name: string
	phone: string
	studentId: string
}

type AdminFormErrors = {
	name?: string
	phone?: string
	studentId?: string
}

const ManageClubRegistrationScreen = () => {
	const { clubService } = useContext(serviceContext)
	const nav = useNavigation()

	useEffect(() => {
		const parent = nav.getParent()
		parent?.setOptions({ tabBarStyle: { display: 'none' } })

		return () => {
			parent?.setOptions({ tabBarStyle: undefined })
		}
	}, [nav])
	const [formStep, setFormStep] = useState<'form' | 'clubSearch'>('form')
	const [adminForm, setAdminForm] = useState<AdminFormData>({
		name: '',
		phone: '',
		studentId: '',
	})
	const [adminFormErrors, setAdminFormErrors] = useState<AdminFormErrors>({})
	const [clubSearchQuery, setClubSearchQuery] = useState<string>('')
	const [searchResults, setSearchResults] = useState<Club[]>([])
	const [selectedClubId, setSelectedClubId] = useState<string>('')
	const [clubPendingRequest, setClubPendingRequest] = useState<Club | null>(null)
	const [isExistingManagerModalVisible, setIsExistingManagerModalVisible] = useState(false)
	const [isSubmittingRequest, setIsSubmittingRequest] = useState(false)
	const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false)
	const [isErrorModalVisible, setIsErrorModalVisible] = useState(false)

	useEffect(() => {
		const timer = setTimeout(async () => {
			if (!clubSearchQuery.trim()) {
				setSearchResults([])
				return
			}

			try {
				const { clubs } = await clubService.searchClubs({ query: clubSearchQuery })
				setSearchResults(clubs)
			} catch {
				setSearchResults([])
			}
		}, 500)

		return () => clearTimeout(timer)
	}, [clubSearchQuery, clubService])

	useEffect(() => {
		if (selectedClubId && !searchResults.some(club => club.uuid === selectedClubId)) {
			setSelectedClubId('')
		}
	}, [searchResults, selectedClubId])

	const validatePhoneNumber = (phone: string): boolean => {
		const phoneRegex = /^01[0-9]\d{8}$/
		return phoneRegex.test(phone.replace(/-/g, ''))
	}

	const validateStudentId = (studentId: string): boolean => {
		const studentIdRegex = /^\d{4}-\d{5}$/
		return studentIdRegex.test(studentId)
	}

	const validateAdminForm = (): boolean => {
		const errors: AdminFormErrors = {}

		if (!adminForm.name.trim()) {
			errors.name = '이름을 입력해주세요'
		}

		if (!adminForm.phone.trim() || !validatePhoneNumber(adminForm.phone)) {
			errors.phone = '올바른 전화번호 형식으로 입력해주세요'
		}

		if (!adminForm.studentId.trim() || !validateStudentId(adminForm.studentId)) {
			errors.studentId = '2023-12345 형식으로 입력해주세요'
		}

		setAdminFormErrors(errors)
		return Object.keys(errors).length === 0
	}

	const isFormFieldsValid =
		adminForm.name.trim() !== '' &&
		adminForm.phone.trim() !== '' &&
		validatePhoneNumber(adminForm.phone) &&
		adminForm.studentId.trim() !== '' &&
		validateStudentId(adminForm.studentId)

	const handleBack = () => {
		if (formStep === 'clubSearch') {
			setFormStep('form')
			setClubSearchQuery('')
			setSearchResults([])
			setSelectedClubId('')
			return
		}

		navigation.goBack()
	}

	const handleFormNext = () => {
		if (!validateAdminForm()) return
		setFormStep('clubSearch')
	}

	const handleClubSelect = (clubId: string) => {
		setSelectedClubId(clubId)
	}

	const submitClubRequest = async (club: Club) => {
		if (isSubmittingRequest) return

		setIsSubmittingRequest(true)
		try {
			await clubService.requestClubManager({
				clubId: club.uuid,
				name: adminForm.name,
				phone: adminForm.phone,
				studentId: adminForm.studentId,
			})
			setIsSuccessModalVisible(true)
		} catch {
			setIsErrorModalVisible(true)
		} finally {
			setIsSubmittingRequest(false)
		}
	}

	const handleClubAddPress = (club: Club) => {
		setSelectedClubId(club.uuid)

		if (club.hasManager) {
			setIsExistingManagerModalVisible(true)
			return
		}

		setClubPendingRequest(club)
	}

	const handleClubRequestConfirm = () => {
		if (!clubPendingRequest) return

		const club = clubPendingRequest
		setClubPendingRequest(null)
		void submitClubRequest(club)
	}

	const handleSuccessConfirm = () => {
		setIsSuccessModalVisible(false)
		setFormStep('form')
		setAdminForm({ name: '', phone: '', studentId: '' })
		setAdminFormErrors({})
		setClubSearchQuery('')
		setSearchResults([])
		setSelectedClubId('')
		navigation.setRoot('마이')
	}

	const renderForm = () => (
		<FlowScreenLayout
			footer={
				<FlowScreenFooter
					backLabel="이전"
					nextLabel="다음"
					onBack={handleBack}
					onNext={handleFormNext}
					nextDisabled={!isFormFieldsValid}
				/>
			}>
			<Text style={styles.title}>운영진 기본 정보를{'\n'}입력해주세요</Text>

			<View style={styles.formFieldGroup}>
				<Text style={styles.formFieldLabel}>이름</Text>
				<TextInput
					style={[styles.formInput, adminFormErrors.name && styles.formInputError]}
					placeholder="홍길동"
					placeholderTextColor={Colors.BODYTEXT_DISABLED}
					value={adminForm.name}
					onChangeText={text => {
						setAdminForm(prev => ({ ...prev, name: text }))
						if (adminFormErrors.name) {
							setAdminFormErrors(prev => ({ ...prev, name: undefined }))
						}
					}}
				/>
				{adminFormErrors.name && <Text style={styles.formErrorText}>{adminFormErrors.name}</Text>}
			</View>

			<View style={styles.formFieldGroup}>
				<Text style={styles.formFieldLabel}>전화번호</Text>
				<TextInput
					style={[styles.formInput, adminFormErrors.phone && styles.formInputError]}
					placeholder="01012345678"
					placeholderTextColor={Colors.BODYTEXT_DISABLED}
					keyboardType="phone-pad"
					value={adminForm.phone}
					onChangeText={text => {
						setAdminForm(prev => ({ ...prev, phone: text }))
						if (adminFormErrors.phone) {
							setAdminFormErrors(prev => ({ ...prev, phone: undefined }))
						}
					}}
				/>
				{adminFormErrors.phone && <Text style={styles.formErrorText}>{adminFormErrors.phone}</Text>}
			</View>

			<View style={styles.formFieldGroup}>
				<Text style={styles.formFieldLabel}>학번</Text>
				<TextInput
					style={[styles.formInput, adminFormErrors.studentId && styles.formInputError]}
					placeholder="1970-12345"
					placeholderTextColor={Colors.BODYTEXT_DISABLED}
					value={adminForm.studentId}
					onChangeText={text => {
						setAdminForm(prev => ({ ...prev, studentId: text }))
						if (adminFormErrors.studentId) {
							setAdminFormErrors(prev => ({ ...prev, studentId: undefined }))
						}
					}}
				/>
				{adminFormErrors.studentId && (
					<Text style={styles.formErrorText}>{adminFormErrors.studentId}</Text>
				)}
			</View>
		</FlowScreenLayout>
	)

	const renderClubSearch = () => (
		<FlowScreenLayout
			footer={
				<FlowScreenFooter
					backLabel="이전"
					onBack={handleBack}
					rightSlot={<View style={styles.footerSpacer} />}
				/>
			}>
			<Text style={styles.title}>운영진 권한을 요청할{'\n'}동아리를 선택해주세요</Text>

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
					{searchResults.map(club => (
						<TouchableOpacity
							key={club.uuid}
							style={[
								styles.clubResultItem,
								selectedClubId === club.uuid && styles.clubResultItemSelected,
							]}
							onPress={() => handleClubSelect(club.uuid)}>
							{club.imageUri ? (
								<Image source={{ uri: club.imageUri }} style={styles.clubIconPlaceholder} />
							) : (
								<View style={styles.clubIconPlaceholder} />
							)}
							<View style={styles.clubInfo}>
								<Text style={styles.clubName} numberOfLines={1}>
									{club.name}
								</Text>
								<Text style={styles.clubDescription} numberOfLines={2}>
									{club.description}
								</Text>
							</View>
							<TouchableOpacity
								style={[
									styles.clubAddButton,
									selectedClubId === club.uuid && styles.clubAddButtonSelected,
									isSubmittingRequest && styles.clubAddButtonDisabled,
								]}
								onPress={() => handleClubAddPress(club)}
								disabled={isSubmittingRequest}>
								<Text
									style={[
										styles.clubAddButtonText,
										selectedClubId === club.uuid && styles.clubAddButtonTextSelected,
										isSubmittingRequest && styles.clubAddButtonTextDisabled,
									]}>
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
			<AlertModal
				visible={isSuccessModalVisible}
				onClose={() => setIsSuccessModalVisible(false)}
				title={'운영진 권한 요청이\n정상적으로 완료되었어요!'}
				buttonLabel="확인"
				onButtonPress={handleSuccessConfirm}
				dismissOnBackdropPress
			/>
			<AlertModal
				visible={isErrorModalVisible}
				onClose={() => setIsErrorModalVisible(false)}
				title={'실행이 완료되지 않았어요'}
				description={
					'네트워크 문제로 실행이 완료되지 않았어요\n네트워크 상태를 확인한 후, 다시 시도해주세요'
				}
				buttonLabel="확인"
				onButtonPress={() => setIsErrorModalVisible(false)}
				dismissOnBackdropPress={false}
			/>
		</FlowScreenLayout>
	)

	return formStep === 'form' ? renderForm() : renderClubSearch()
}

export default ManageClubRegistrationScreen

const styles = StyleSheet.create({
	title: {
		fontSize: 25,
		fontWeight: '600',
		color: Colors.BODYTEXT_MAIN,
		lineHeight: 30,
		marginBottom: 15,
	},
	formFieldGroup: {
		marginBottom: 20,
	},
	formFieldLabel: {
		fontSize: 18,
		fontWeight: '600',
		color: Colors.BODYTEXT_SUB,
		marginBottom: 5,
		paddingHorizontal: 5,
	},
	formInput: {
		borderWidth: 1,
		borderColor: Colors.BODYTEXT_DISABLED,
		borderRadius: 8,
		paddingHorizontal: 15,
		paddingVertical: 18,
		fontSize: 16,
		fontWeight: '500',
		color: Colors.BODYTEXT_MAIN,
		height: 54,
	},
	formInputError: {
		borderColor: Colors.POINTCOLOR,
	},
	formErrorText: {
		fontSize: 14,
		color: Colors.POINTCOLOR,
		paddingHorizontal: 5,
		marginTop: 5,
	},
	searchInputContainer: {
		backgroundColor: Colors.BACKGROUND_SUB,
		borderRadius: 10,
		paddingHorizontal: 20,
		paddingVertical: 16,
		height: 49,
		justifyContent: 'center',
	},
	searchInput: {
		flex: 1,
		padding: 0,
		fontSize: 14,
		fontWeight: '500',
		color: Colors.BODYTEXT_MAIN,
	},
	searchResultsContainer: {
		marginTop: 20,
		gap: 10,
	},
	clubResultItem: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: Colors.WHITE,
		borderRadius: 10,
		paddingHorizontal: 15,
		paddingVertical: 16,
		borderWidth: 1,
		borderColor: 'transparent',
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
		fontWeight: '600',
		color: Colors.BODYTEXT_MAIN,
		lineHeight: 19,
	},
	clubDescription: {
		fontSize: 14,
		fontWeight: '400',
		color: Colors.BODYTEXT_SUB,
		lineHeight: 17,
	},
	clubAddButton: {
		width: 24,
		height: 24,
		borderRadius: 12,
		backgroundColor: Colors.BODYTEXT_DISABLED,
		alignItems: 'center',
		justifyContent: 'center',
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
		fontWeight: '600',
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
})
