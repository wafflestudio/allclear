import React, { useEffect, useState } from 'react'
import Toast from 'react-native-toast-message'
import { useProfile } from '@/shared/contexts/profileContext'
import { useLoginBottomSheet } from '@/shared/contexts/loginBottomSheetContext'
import { useRegisterClub } from '@/features/register-club/hooks/useRegisterClub'
import { ManagerInfoScreen } from '@/features/register-club/screens/ManagerInfoScreen'
import { ClubBasicInfoScreen } from '@/features/register-club/screens/ClubBasicInfoScreen'
import { CategorySelectionScreen } from '@/features/register-club/screens/CategorySelectionScreen'
import { ClubAffiliationScreen } from '@/features/register-club/screens/ClubAffiliationScreen'
import { ClubDetailsScreen } from '@/features/register-club/screens/ClubDetailsScreen'
import { RegisterClubConfirmModal } from '@/features/register-club/components/RegisterClubConfirmModal'
import { RegisterClubFormData, initialFormData } from '@/features/register-club/types'
import { normalizeUrl } from '@/features/register-club/validation'
import { RegisterClubRequest } from '@/repositories/club'
import { User } from '@/entities/user'
import { getPhoneNumberPrefill, getStudentIdPrefill } from '@/shared/utils/managerInfo'
import { navigation } from '@/shared/utils/navigation'

const getInitialFormData = (user: User | null): RegisterClubFormData => ({
	...initialFormData,
	managerName: user?.name ?? '',
	managerPhone: getPhoneNumberPrefill(user?.phone ?? ''),
	studentId: getStudentIdPrefill(user?.admissionClass ?? null),
})

const mapFormDataToRequest = (formData: RegisterClubFormData): RegisterClubRequest => {
	const clubData: RegisterClubRequest['club_data'] = {
		name: formData.clubName,
		type: formData.clubType,
		category: formData.selectedCategories[0] || '',
		affiliation: formData.department,
		short_description: formData.shortIntro,
		recruit_type: formData.recruitType,
		min_activity_period: parseInt(formData.activityCycle, 10) || 0,
		has_dongbang: formData.hasDongbang,
		sns: normalizeUrl(formData.clubSNS),
		introduction: formData.clubDescription,
	}

	// Send dongbang_location (API key) only when the club has a dongbang
	if (formData.hasDongbang && formData.dongbangLocation) {
		clubData.dongbang_location = formData.dongbangLocation
	}

	return {
		club_data: clubData,
		manager_data: {
			name: formData.managerName,
			phone: formData.managerPhone,
			student_id: formData.studentId,
		},
	}
}

export const RegisterClubScreenContainer = () => {
	const { user } = useProfile()
	const [currentStep, setCurrentStep] = useState(0)
	const [formData, setFormData] = useState<RegisterClubFormData>(() => getInitialFormData(user))
	const [showConfirm, setShowConfirm] = useState(false)
	const { openBottomSheet: openLoginSheet } = useLoginBottomSheet()

	useEffect(() => {
		if (!user) {
			return
		}

		const managerPhone = getPhoneNumberPrefill(user.phone)
		const studentId = getStudentIdPrefill(user.admissionClass)
		setFormData(prev => ({
			...prev,
			managerName: prev.managerName || user.name,
			managerPhone: prev.managerPhone || managerPhone,
			studentId: prev.studentId || studentId,
		}))
	}, [user])

	// 등록 요청 후에는 성공/실패와 무관하게 폼을 초기화하고 마이페이지 메인으로 돌아간다.
	const resetAndExit = () => {
		setShowConfirm(false)
		setFormData(getInitialFormData(user))
		setCurrentStep(0)
		navigation.navigate('마이')
	}

	const { mutate: registerClub, isLoading } = useRegisterClub({
		onSuccess: message => {
			Toast.show({
				type: 'success',
				text1: message,
				position: 'top',
				topOffset: 60,
				visibilityTime: 2000,
			})
			resetAndExit()
		},
		onFailure: message => {
			Toast.show({
				type: 'error',
				text1: '동아리 등록 요청 중 문제가 생겼어요',
				text2: message,
				position: 'top',
				topOffset: 60,
				visibilityTime: 2000,
			})
			resetAndExit()
		},
	})

	const handleFormDataChange = (data: Partial<RegisterClubFormData>) => {
		setFormData(prev => ({ ...prev, ...data }))
	}

	const handleNext = () => {
		setCurrentStep(prev => Math.min(prev + 1, 4))
	}

	const handlePrevious = () => {
		setCurrentStep(prev => Math.max(prev - 1, 0))
	}

	// 이전 on the first step exits the full-screen flow back to the MyPage tab.
	const handleExit = () => {
		setCurrentStep(0)
		navigation.navigate('마이')
	}

	const handleOpenConfirm = () => {
		// Check if user is logged in before showing the confirmation
		if (!user) {
			Toast.show({
				type: 'error',
				text1: '로그인이 필요해요',
				text2: '동아리를 등록하려면 로그인해주세요',
				position: 'top',
				topOffset: 60,
				visibilityTime: 2000,
			})
			openLoginSheet()
			return
		}
		setShowConfirm(true)
	}

	const handleComplete = () => {
		registerClub({
			request: mapFormDataToRequest(formData),
			imageFile: formData.clubImageFile,
		})
	}

	const screens = [
		<ManagerInfoScreen
			key="step0"
			formData={formData}
			onFormDataChange={handleFormDataChange}
			onNext={handleNext}
			onPrevious={handleExit}
		/>,
		<ClubBasicInfoScreen
			key="step1"
			formData={formData}
			onFormDataChange={handleFormDataChange}
			onNext={handleNext}
			onPrevious={handlePrevious}
		/>,
		<CategorySelectionScreen
			key="step2"
			formData={formData}
			onFormDataChange={handleFormDataChange}
			onNext={handleNext}
			onPrevious={handlePrevious}
		/>,
		<ClubAffiliationScreen
			key="step3"
			formData={formData}
			onFormDataChange={handleFormDataChange}
			onNext={handleNext}
			onPrevious={handlePrevious}
		/>,
		<ClubDetailsScreen
			key="step4"
			formData={formData}
			onFormDataChange={handleFormDataChange}
			onComplete={handleOpenConfirm}
			onPrevious={handlePrevious}
			isLoading={isLoading}
		/>,
	]

	// 6 stages total: the 5 form steps plus the final confirmation popup,
	// so the bar is never fully filled while a form step is on screen.
	const progress = (currentStep + 1) / (screens.length + 1)

	return (
		<>
			{React.cloneElement(screens[currentStep], { progress })}
			<RegisterClubConfirmModal
				visible={showConfirm}
				clubName={formData.clubName}
				isLoading={isLoading}
				onCancel={() => setShowConfirm(false)}
				onConfirm={handleComplete}
			/>
		</>
	)
}
