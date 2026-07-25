import React, { memo, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
	ActivityIndicator,
	Dimensions,
	FlatList,
	Image,
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from 'react-native'
import { BlurView } from '@react-native-community/blur'
import { RouteProp, useRoute } from '@react-navigation/native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { launchImageLibrary } from 'react-native-image-picker'
import Toast from 'react-native-toast-message'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { Category } from '@/entities/category'
import {
	areValidSnsUrls,
	getClubSnsUrls,
	getSnsRequestFields,
	normalizeSnsUrls,
} from '@/shared/utils/clubSns'
import { ManagedClubDetail, UpdateManagedClubRequest } from '@/repositories/club'
import TextField from '@/shared/components/TextField'
import ClubActivityImagePicker from '@/shared/components/ClubActivityImagePicker'
import ClubSnsInputList from '@/shared/components/ClubSnsInputList'
import { CLUB_CATEGORIES } from '@/shared/constants/category'
import { CLUB_RECRUIT_TYPES } from '@/shared/constants/club'
import { Colors } from '@/shared/constants/colors'
import { buildDepartmentOptions, DEFAULT_DEPARTMENT_OPTIONS } from '@/shared/constants/departments'
import { SCREEN_TYPE, StackParamList } from '@/shared/constants/screen'
import { typography } from '@/shared/constants/typography'
import { serviceContext } from '@/shared/contexts/serviceContext'
import {
	decrementActivityCycleValue,
	incrementActivityCycleValue,
	type ActivityCycleMode,
} from '@/shared/utils/activityCycle'
import { ms, s, vs } from '@/shared/utils/scale'
import { navigation } from '@/shared/utils/navigation'
import type { EditableImage, ImageFile } from '@/shared/types/image'
import { getManagedClubUpdateErrorContent } from '@/features/club/utils/managedClubUpdateError'

type RouteProps = RouteProp<StackParamList, typeof SCREEN_TYPE.CLUB_INFO_EDIT>

type ClubInfoEditFormData = {
	clubImage: string | null
	clubName: string
	category: Category['name'] | ''
	department: string
	shortIntro: string
	recruitType: string
	activityCycle: string
	hasDongbang: boolean
	dongbangLocation: string
	clubSNSUrls: string[]
	activityImages: EditableImage[]
	clubDescription: string
}

type ComparableClubInfo = {
	name: string
	category: Category['name'] | ''
	affiliation: string
	shortDescription: string
	recruitType: string
	minActivityPeriod: number
	hasDongbang: boolean
	dongbangLocation: string
	snsUrls: string[]
	introduction: string
}

type SuccessModalProps = {
	visible: boolean
	title: string
	onConfirm: () => void
}

const TILE_SIZE = (Dimensions.get('window').width - s(20) * 2 - s(12) * 2) / 3

const initialFormData: ClubInfoEditFormData = {
	clubImage: null,
	clubName: '',
	category: '',
	department: '',
	shortIntro: '',
	recruitType: '',
	activityCycle: '',
	hasDongbang: false,
	dongbangLocation: '',
	clubSNSUrls: [''],
	activityImages: [],
	clubDescription: '',
}

const getClubDepartment = (club: ManagedClubDetail): string => {
	const collegeDepartment = club.collegeMajor?.major || club.collegeMajor?.college
	if (collegeDepartment) {
		return collegeDepartment
	}

	return club.affiliationType && club.affiliationType !== '소속동아리' ? club.affiliationType : ''
}

const mapClubToFormData = (club: ManagedClubDetail): ClubInfoEditFormData => {
	const snsUrls = getClubSnsUrls(club)
	return {
		clubImage: club.imageUri || null,
		clubName: club.name ?? '',
		category: club.category ?? '',
		department: getClubDepartment(club),
		shortIntro: club.shortDescription || '',
		recruitType: CLUB_RECRUIT_TYPES.includes(club.recruitType) ? club.recruitType : '',
		activityCycle:
			club.minActivityPeriod !== null && club.minActivityPeriod !== undefined
				? club.minActivityPeriod > 0
					? String(club.minActivityPeriod)
					: ''
				: club.activityCycle || '',
		hasDongbang: club.hasDongbang ?? false,
		dongbangLocation: club.dongbangLocation ?? '',
		clubSNSUrls: snsUrls.length > 0 ? snsUrls : [''],
		activityImages: (club.activityImageUrls ?? []).map((uri, index) => ({
			id: `remote-${index}-${uri}`,
			uri,
		})),
		clubDescription: club.introduction ?? '',
	}
}

const getInitialActivityCycleMode = (club: ManagedClubDetail): ActivityCycleMode => {
	const minActivityPeriod = club.minActivityPeriod
	if (minActivityPeriod !== null && minActivityPeriod !== undefined) {
		return minActivityPeriod > 0 ? 'number' : 'none'
	}
	return club.activityCycle ? 'number' : 'none'
}

const normalizeComparableClubInfo = (
	data: ClubInfoEditFormData,
	activityCycleMode: ActivityCycleMode,
): ComparableClubInfo => ({
	name: data.clubName.trim(),
	category: data.category,
	affiliation: data.department.trim(),
	shortDescription: data.shortIntro.trim(),
	recruitType: data.recruitType,
	minActivityPeriod: activityCycleMode === 'number' ? parseInt(data.activityCycle, 10) || 0 : 0,
	hasDongbang: data.hasDongbang,
	dongbangLocation: data.hasDongbang ? data.dongbangLocation.trim() : '',
	snsUrls: normalizeSnsUrls(data.clubSNSUrls),
	introduction: data.clubDescription.trim(),
})

const buildUpdateManagedClubRequest = (
	uuid: string,
	current: ComparableClubInfo,
	initial: ComparableClubInfo,
): UpdateManagedClubRequest | null => {
	const request: UpdateManagedClubRequest = { uuid }

	if (current.name !== initial.name) {
		request.name = current.name
	}
	if (current.category !== initial.category) {
		request.category = current.category as Category['name']
	}
	if (current.affiliation !== initial.affiliation) {
		request.affiliation = current.affiliation
	}
	if (current.shortDescription !== initial.shortDescription) {
		request.short_description = current.shortDescription
	}
	if (current.recruitType !== initial.recruitType) {
		request.recruit_type = current.recruitType
	}
	if (current.minActivityPeriod !== initial.minActivityPeriod) {
		request.min_activity_period = current.minActivityPeriod
	}
	if (current.hasDongbang !== initial.hasDongbang) {
		request.has_dongbang = current.hasDongbang
	}
	if (
		current.dongbangLocation !== initial.dongbangLocation ||
		current.hasDongbang !== initial.hasDongbang
	) {
		request.dongbang_location = current.dongbangLocation
	}
	if (JSON.stringify(current.snsUrls) !== JSON.stringify(initial.snsUrls)) {
		Object.assign(request, getSnsRequestFields(current.snsUrls))
	}
	if (current.introduction !== initial.introduction) {
		request.introduction = current.introduction
	}

	return Object.keys(request).length > 1 ? request : null
}

const SuccessModal = memo(({ visible, title, onConfirm }: SuccessModalProps) => (
	<Modal visible={visible} transparent animationType="fade" onRequestClose={onConfirm}>
		<Pressable style={styles.modalOverlay} onPress={onConfirm}>
			<BlurView
				style={StyleSheet.absoluteFillObject}
				blurType="light"
				blurAmount={1}
				overlayColor="transparent"
				reducedTransparencyFallbackColor="transparent"
			/>
			<Pressable style={styles.modalCard} onPress={e => e.stopPropagation()}>
				<View style={styles.modalContents}>
					<Text style={styles.modalTitle}>{title}</Text>
				</View>
				<Pressable style={styles.modalSingleBtn} onPress={onConfirm}>
					<Text style={styles.modalConfirmText}>확인</Text>
				</Pressable>
			</Pressable>
		</Pressable>
	</Modal>
))

SuccessModal.displayName = 'SuccessModal'

type ClubCategorySectionProps = {
	category: ClubInfoEditFormData['category']
	onChange: (category: ClubInfoEditFormData['category']) => void
}

const ClubCategorySection = memo(({ category, onChange }: ClubCategorySectionProps) => {
	return (
		<View style={styles.fieldWrapper}>
			<Text style={styles.label}>카테고리</Text>
			<View style={styles.categoryGrid}>
				{CLUB_CATEGORIES.map(categoryOption => {
					const isSelected = category === categoryOption
					return (
						<Pressable
							key={categoryOption}
							style={[styles.categoryBlock, isSelected && styles.categoryBlockSelected]}
							onPress={() => onChange(categoryOption)}>
							<Text style={[styles.categoryText, isSelected && styles.categoryTextSelected]}>
								{categoryOption}
							</Text>
						</Pressable>
					)
				})}
			</View>
		</View>
	)
})

ClubCategorySection.displayName = 'ClubCategorySection'

type ClubRecruitTypeSectionProps = {
	recruitType: string
	onChange: (recruitType: string) => void
}

const ClubRecruitTypeSection = memo(({ recruitType, onChange }: ClubRecruitTypeSectionProps) => {
	return (
		<View style={styles.fieldWrapper}>
			<Text style={styles.fieldLabel}>모집 형태</Text>
			<View style={styles.buttonGroup}>
				{CLUB_RECRUIT_TYPES.map(recruitTypeOption => {
					const isSelected = recruitType === recruitTypeOption
					return (
						<Pressable
							key={recruitTypeOption}
							style={[styles.typeButton, isSelected && styles.typeButtonSelected]}
							onPress={() => onChange(recruitTypeOption)}>
							<Text style={[styles.typeButtonText, isSelected && styles.typeButtonTextSelected]}>
								{recruitTypeOption}
							</Text>
						</Pressable>
					)
				})}
			</View>
		</View>
	)
})

ClubRecruitTypeSection.displayName = 'ClubRecruitTypeSection'

type ClubActivityPeriodSectionProps = {
	mode: ActivityCycleMode
	semesters: number
	onModeChange: (mode: ActivityCycleMode) => void
	onDecrement: () => void
	onIncrement: () => void
}

const ClubActivityPeriodSection = memo(
	({ mode, semesters, onModeChange, onDecrement, onIncrement }: ClubActivityPeriodSectionProps) => {
		return (
			<View style={styles.fieldWrapper}>
				<Text style={styles.fieldLabel}>(최소) 활동 기간</Text>
				<View style={styles.periodRow}>
					<View style={styles.modeButtons}>
						<Pressable
							style={[styles.typeButton, mode === 'none' && styles.typeButtonSelected]}
							onPress={() => onModeChange('none')}>
							<Text
								style={[styles.typeButtonText, mode === 'none' && styles.typeButtonTextSelected]}>
								없음
							</Text>
						</Pressable>
						<Pressable
							style={[styles.typeButton, mode === 'number' && styles.typeButtonSelected]}
							onPress={() => onModeChange('number')}>
							<Text
								style={[styles.typeButtonText, mode === 'number' && styles.typeButtonTextSelected]}>
								있음
							</Text>
						</Pressable>
					</View>

					<View style={styles.periodStepper}>
						<Text style={styles.semesterValue}>{semesters}학기</Text>
						<View style={styles.stepperPill}>
							<Pressable style={styles.stepperButton} onPress={onDecrement}>
								<Icon name="remove" size={ms(18)} color={Colors.BODYTEXT_SUB} />
							</Pressable>
							<View style={styles.stepperDivider} />
							<Pressable style={styles.stepperButton} onPress={onIncrement}>
								<Icon name="add" size={ms(18)} color={Colors.BODYTEXT_SUB} />
							</Pressable>
						</View>
					</View>
				</View>
			</View>
		)
	},
)

ClubActivityPeriodSection.displayName = 'ClubActivityPeriodSection'

type ClubDongbangSectionProps = {
	hasDongbang: boolean
	location: string
	onHasDongbangChange: (value: boolean) => void
	onLocationChange: (value: string) => void
}

const ClubDongbangSection = memo(
	({ hasDongbang, location, onHasDongbangChange, onLocationChange }: ClubDongbangSectionProps) => {
		return (
			<View style={styles.fieldWrapper}>
				<Text style={styles.fieldLabel}>동방 보유 여부</Text>
				<View style={styles.buttonGroup}>
					<Pressable
						style={[styles.typeButton, hasDongbang && styles.typeButtonSelected]}
						onPress={() => onHasDongbangChange(true)}>
						<Text style={[styles.typeButtonText, hasDongbang && styles.typeButtonTextSelected]}>
							보유
						</Text>
					</Pressable>
					<Pressable
						style={[styles.typeButton, !hasDongbang && styles.typeButtonSelected]}
						onPress={() => onHasDongbangChange(false)}>
						<Text style={[styles.typeButtonText, !hasDongbang && styles.typeButtonTextSelected]}>
							미보유
						</Text>
					</Pressable>
				</View>

				{hasDongbang && (
					<View style={styles.iconInputRow}>
						<Icon name="location-on" size={ms(20)} color={Colors.BODYTEXT_DISABLED} />
						<TextInput
							style={styles.iconInput}
							placeholder="동방 위치를 입력하세요"
							placeholderTextColor={Colors.BODYTEXT_DISABLED}
							value={location}
							onChangeText={onLocationChange}
							maxLength={100}
						/>
					</View>
				)}
			</View>
		)
	},
)

ClubDongbangSection.displayName = 'ClubDongbangSection'

type ClubBasicInfoSectionProps = {
	clubImage: string | null
	clubName: string
	department: string
	shortIntro: string
	showDepartmentDropdown: boolean
	onSelectImage: () => void
	onClubNameChange: (value: string) => void
	onToggleDepartmentDropdown: () => void
	onShortIntroChange: (value: string) => void
}

const ClubBasicInfoSection = memo(
	({
		clubImage,
		clubName,
		department,
		shortIntro,
		showDepartmentDropdown,
		onSelectImage,
		onClubNameChange,
		onToggleDepartmentDropdown,
		onShortIntroChange,
	}: ClubBasicInfoSectionProps) => (
		<>
			<View style={styles.fieldWrapper}>
				<Text style={styles.label}>동아리 대표 이미지</Text>
				<Text style={styles.helperDescription}>4X4 정방형 이미지를 권장드려요</Text>
				<Pressable style={styles.imageUploadBox} onPress={onSelectImage}>
					{clubImage ? (
						<Image source={{ uri: clubImage }} style={styles.uploadedImage} />
					) : (
						<Icon name="add" size={s(40)} color={Colors.BODYTEXT_DISABLED} />
					)}
				</Pressable>
				<Pressable style={styles.imageChangeButton} onPress={onSelectImage}>
					<Text style={styles.imageChangeText}>이미지 변경</Text>
				</Pressable>
			</View>

			<View style={styles.fieldWrapper}>
				<Text style={styles.label}>동아리명</Text>
				<TextField
					value={clubName}
					placeholder="와플스튜디오"
					onChangeText={onClubNameChange}
					maxLength={30}
				/>
			</View>

			<View style={styles.fieldWrapper}>
				<Text style={styles.label}>한줄소개</Text>
				<View style={styles.affiliationRow}>
					<Pressable
						style={[styles.dropdown, showDepartmentDropdown && styles.dropdownActive]}
						onPress={onToggleDepartmentDropdown}>
						<Text style={styles.dropdownText} numberOfLines={1}>
							{department || '단과대/학과'}
						</Text>
						<Icon
							name={showDepartmentDropdown ? 'expand-less' : 'expand-more'}
							size={ms(20)}
							color={Colors.BODYTEXT_MAIN}
						/>
					</Pressable>
					<Text style={styles.affiliationLabel}>소속</Text>
				</View>

				<TextField
					placeholder="웹/앱 개발 동아리, 경영전략학회"
					value={shortIntro}
					onChangeText={onShortIntroChange}
					maxLength={100}
				/>
			</View>
		</>
	),
)

ClubBasicInfoSection.displayName = 'ClubBasicInfoSection'

type ClubDescriptionSectionProps = {
	description: string
	onChange: (value: string) => void
}

const ClubDescriptionSection = memo(({ description, onChange }: ClubDescriptionSectionProps) => (
	<View style={styles.fieldWrapper}>
		<Text style={styles.fieldLabel}>동아리 추가 설명</Text>
		<TextInput
			style={styles.descriptionInput}
			placeholder="동아리에 대해 자세히 설명해주세요"
			placeholderTextColor={Colors.BODYTEXT_DISABLED}
			value={description}
			onChangeText={onChange}
			maxLength={500}
			multiline
			textAlignVertical="top"
		/>
	</View>
))

ClubDescriptionSection.displayName = 'ClubDescriptionSection'

type ClubEditFooterProps = {
	paddingBottom: number
	disabled: boolean
	isSubmitting: boolean
	onSubmit: () => void
}

const ClubEditFooter = memo(
	({ paddingBottom, disabled, isSubmitting, onSubmit }: ClubEditFooterProps) => (
		<View style={[styles.footer, { paddingBottom }]}>
			<Pressable
				style={[styles.submitButton, disabled && styles.submitButtonDisabled]}
				onPress={onSubmit}
				disabled={disabled}>
				<Text style={styles.submitButtonText}>{isSubmitting ? '수정 중...' : '수정'}</Text>
			</Pressable>
		</View>
	),
)

ClubEditFooter.displayName = 'ClubEditFooter'

type DepartmentModalProps = {
	visible: boolean
	search: string
	options: string[]
	selectedDepartment: string
	onClose: () => void
	onSearchChange: (value: string) => void
	onSelect: (department: string) => void
}

const DepartmentModal = memo(
	({
		visible,
		search,
		options,
		selectedDepartment,
		onClose,
		onSearchChange,
		onSelect,
	}: DepartmentModalProps) => (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
			<Pressable style={styles.departmentModalOverlay} onPress={onClose}>
				<Pressable style={styles.departmentModalCard} onPress={event => event.stopPropagation()}>
					<Text style={styles.departmentModalTitle}>소속 선택</Text>
					<TextInput
						style={styles.dropdownSearchInput}
						placeholder="소속 검색"
						placeholderTextColor={Colors.BODYTEXT_DISABLED}
						value={search}
						onChangeText={onSearchChange}
					/>
					<FlatList
						data={options}
						style={styles.dropdownList}
						keyboardShouldPersistTaps="handled"
						keyExtractor={department => department}
						renderItem={({ item: department }) => {
							const isSelected = selectedDepartment === department
							return (
								<Pressable
									style={[styles.dropdownItem, isSelected && styles.dropdownItemSelected]}
									onPress={() => onSelect(department)}>
									<Text
										style={[
											styles.dropdownItemText,
											isSelected && styles.dropdownItemTextSelected,
										]}>
										{department}
									</Text>
								</Pressable>
							)
						}}
						ListEmptyComponent={<Text style={styles.dropdownEmptyText}>검색 결과가 없어요</Text>}
					/>
				</Pressable>
			</Pressable>
		</Modal>
	),
)

DepartmentModal.displayName = 'DepartmentModal'

const ClubInfoEditScreen = () => {
	const route = useRoute<RouteProps>()
	const { clubId, fromClubRegistrationEdit = false, managerData } = route.params
	const { clubService, userService } = useContext(serviceContext)
	const queryClient = useQueryClient()
	const insets = useSafeAreaInsets()

	const [formData, setFormData] = useState<ClubInfoEditFormData>(initialFormData)
	const [activityCycleMode, setActivityCycleMode] = useState<ActivityCycleMode>('none')
	const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false)
	const [departmentSearch, setDepartmentSearch] = useState('')
	const [imageFile, setImageFile] = useState<ImageFile | null>(null)
	const [showSuccessModal, setShowSuccessModal] = useState(false)

	const { data: club, isLoading } = useQuery({
		queryKey: ['managedClub', clubId],
		queryFn: () => clubService.getManagedClubDetail({ uuid: clubId }),
	})
	const { data: departmentOptions = DEFAULT_DEPARTMENT_OPTIONS } = useQuery({
		queryKey: ['collegeMajors', 'clubAffiliation'],
		queryFn: () => userService.listCollegeMajors({ includeNullMajor: true }),
		select: data => buildDepartmentOptions(data.majors),
	})

	useEffect(() => {
		if (club) {
			setFormData(mapClubToFormData(club))
			setActivityCycleMode(getInitialActivityCycleMode(club))
			setImageFile(null)
		}
	}, [club])

	const setFormField = useCallback(
		<K extends keyof ClubInfoEditFormData>(key: K, value: ClubInfoEditFormData[K]) => {
			setFormData(prev => ({ ...prev, [key]: value }))
		},
		[],
	)

	const activitySemesters = parseInt(formData.activityCycle, 10) || 0
	const filteredDepartmentOptions = useMemo(() => {
		const keyword = departmentSearch.trim()
		if (!keyword) {
			return departmentOptions
		}
		return departmentOptions.filter(department => department.includes(keyword))
	}, [departmentOptions, departmentSearch])

	const handleSelectDepartment = useCallback(
		(department: string) => {
			setFormField('department', department)
			setShowDepartmentDropdown(false)
			setDepartmentSearch('')
		},
		[setFormField],
	)
	const handleCloseDepartmentDropdown = useCallback(() => setShowDepartmentDropdown(false), [])

	const handleSelectImage = useCallback(async () => {
		const result = await launchImageLibrary({
			mediaType: 'photo',
			selectionLimit: 1,
			includeBase64: false,
		})

		if (result.didCancel) {
			return
		}

		if (result.errorCode) {
			Toast.show({
				type: 'error',
				text1: '이미지를 불러오지 못했어요',
				text2: result.errorMessage,
				position: 'top',
				topOffset: 60,
				visibilityTime: 2000,
			})
			return
		}

		const asset = result.assets?.[0]
		if (!asset?.uri) {
			return
		}

		setFormField('clubImage', asset.uri)
		setImageFile({
			uri: asset.uri,
			type: asset.type ?? 'image/jpeg',
			name: asset.fileName ?? `club_${Date.now()}.jpg`,
		})
	}, [setFormField])

	const handleActivityCycleModeChange = useCallback(
		(mode: ActivityCycleMode) => {
			setActivityCycleMode(mode)
			setFormField('activityCycle', mode === 'number' ? '1' : '')
		},
		[setFormField],
	)

	const incrementActivityCycle = useCallback(() => {
		const next = incrementActivityCycleValue(activitySemesters)
		setActivityCycleMode(next.mode)
		setFormField('activityCycle', next.value)
	}, [activitySemesters, setFormField])

	const decrementActivityCycle = useCallback(() => {
		const next = decrementActivityCycleValue(activitySemesters)
		setActivityCycleMode(next.mode)
		setFormField('activityCycle', next.value)
	}, [activitySemesters, setFormField])

	const handleSetHasDongbang = useCallback((value: boolean) => {
		setFormData(prev => ({
			...prev,
			hasDongbang: value,
			dongbangLocation: value ? prev.dongbangLocation : '',
		}))
	}, [])

	const handleCategoryChange = useCallback(
		(category: ClubInfoEditFormData['category']) => setFormField('category', category),
		[setFormField],
	)
	const handleClubNameChange = useCallback(
		(clubName: string) => setFormField('clubName', clubName),
		[setFormField],
	)
	const handleShortIntroChange = useCallback(
		(shortIntro: string) => setFormField('shortIntro', shortIntro),
		[setFormField],
	)
	const handleToggleDepartmentDropdown = useCallback(
		() => setShowDepartmentDropdown(prev => !prev),
		[],
	)
	const handleRecruitTypeChange = useCallback(
		(recruitType: string) => setFormField('recruitType', recruitType),
		[setFormField],
	)
	const handleDongbangLocationChange = useCallback(
		(location: string) => setFormField('dongbangLocation', location),
		[setFormField],
	)
	const handleSnsUrlsChange = useCallback(
		(clubSNSUrls: string[]) => setFormField('clubSNSUrls', clubSNSUrls),
		[setFormField],
	)
	const handleActivityImagesChange = useCallback(
		(activityImages: EditableImage[]) => setFormField('activityImages', activityImages),
		[setFormField],
	)
	const handleDescriptionChange = useCallback(
		(clubDescription: string) => setFormField('clubDescription', clubDescription),
		[setFormField],
	)

	const initialComparable = useMemo(() => {
		if (!club) {
			return null
		}
		const initialData = mapClubToFormData(club)
		const initialActivityCycleMode = getInitialActivityCycleMode(club)
		return normalizeComparableClubInfo(initialData, initialActivityCycleMode)
	}, [club])

	const currentComparable = useMemo(
		() => normalizeComparableClubInfo(formData, activityCycleMode),
		[activityCycleMode, formData],
	)

	const isSNSComplete =
		JSON.stringify(currentComparable.snsUrls) === JSON.stringify(initialComparable?.snsUrls) ||
		areValidSnsUrls(formData.clubSNSUrls)

	const isComplete =
		!!formData.clubImage &&
		!!formData.clubName.trim() &&
		!!formData.category &&
		!!formData.department.trim() &&
		!!formData.shortIntro.trim() &&
		!!formData.recruitType.trim() &&
		isSNSComplete &&
		!!formData.clubDescription.trim() &&
		(activityCycleMode === 'none' || !!formData.activityCycle.trim())

	const updateRequest = useMemo(() => {
		if (!initialComparable) {
			return null
		}
		return buildUpdateManagedClubRequest(clubId, currentComparable, initialComparable)
	}, [clubId, currentComparable, initialComparable])

	const initialActivityImageUrls = club?.activityImageUrls ?? []
	const retainedActivityImageUrls = formData.activityImages
		.filter(image => !image.file)
		.map(image => image.uri)
	const newActivityImageFiles = formData.activityImages.flatMap(image =>
		image.file ? [image.file] : [],
	)
	const activityImagesChanged =
		newActivityImageFiles.length > 0 ||
		JSON.stringify(retainedActivityImageUrls) !== JSON.stringify(initialActivityImageUrls)
	const hasChanges = !!imageFile || !!updateRequest || activityImagesChanged
	const hasAnyChanges = hasChanges || managerData !== undefined

	const { mutate: updateClub, isPending: isSubmitting } = useMutation({
		mutationFn: async () => {
			if (imageFile) {
				await clubService.uploadManagedClubImage({
					clubId,
					uri: imageFile.uri,
					type: imageFile.type,
					name: imageFile.name,
				})
			}

			const request: UpdateManagedClubRequest = updateRequest
				? { ...updateRequest }
				: { uuid: clubId }

			if (activityImagesChanged) {
				const uploadedImages = await Promise.all(
					newActivityImageFiles.map(file =>
						clubService.uploadClubActivityImage({ clubId, ...file }),
					),
				)
				request.activity_image_urls = [
					...retainedActivityImageUrls,
					...uploadedImages.map(image => image.url),
				]
			}

			if (managerData) {
				request.manager_data = managerData
			}

			if (Object.keys(request).length > 1) {
				return clubService.updateManagedClub(request)
			}
		},
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ['managedClub', clubId] }),
				queryClient.invalidateQueries({ queryKey: ['manageClubs'] }),
				queryClient.invalidateQueries({ queryKey: ['clubs', clubId] }),
				queryClient.invalidateQueries({
					queryKey: ['clubManagerInfo', 'clubRegistration', clubId],
				}),
			])
			setShowSuccessModal(true)
		},
		onError: error => {
			const errorContent = getManagedClubUpdateErrorContent(error)
			Toast.show({
				type: 'error',
				text1: errorContent.title,
				text2: errorContent.description,
				position: 'top',
				topOffset: 60,
				visibilityTime: 2000,
			})
		},
	})

	const handleSubmit = useCallback(() => {
		if (!isComplete || !hasAnyChanges || isSubmitting) {
			return
		}
		updateClub()
	}, [hasAnyChanges, isComplete, isSubmitting, updateClub])

	const handleConfirmSuccess = useCallback(() => {
		setShowSuccessModal(false)
		if (fromClubRegistrationEdit) {
			navigation.setRoot('마이')
			return
		}

		navigation.goBack()
	}, [fromClubRegistrationEdit])

	return (
		<SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
			<View style={styles.header}>
				<Pressable style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={8}>
					<Icon name="chevron-left" size={ms(24)} color={Colors.BODYTEXT_SUB} />
				</Pressable>
				<Text style={styles.headerTitle}>동아리 정보 수정</Text>
			</View>

			{isLoading ? (
				<View style={styles.loadingContent}>
					<ActivityIndicator color={Colors.POINTCOLOR} />
				</View>
			) : (
				<>
					<ScrollView
						style={styles.scroll}
						contentContainerStyle={styles.content}
						showsVerticalScrollIndicator={false}
						keyboardShouldPersistTaps="handled">
						<View style={styles.form}>
							<ClubBasicInfoSection
								clubImage={formData.clubImage}
								clubName={formData.clubName}
								department={formData.department}
								shortIntro={formData.shortIntro}
								showDepartmentDropdown={showDepartmentDropdown}
								onSelectImage={handleSelectImage}
								onClubNameChange={handleClubNameChange}
								onToggleDepartmentDropdown={handleToggleDepartmentDropdown}
								onShortIntroChange={handleShortIntroChange}
							/>

							<ClubCategorySection category={formData.category} onChange={handleCategoryChange} />

							<ClubRecruitTypeSection
								recruitType={formData.recruitType}
								onChange={handleRecruitTypeChange}
							/>

							<ClubActivityPeriodSection
								mode={activityCycleMode}
								semesters={activitySemesters}
								onModeChange={handleActivityCycleModeChange}
								onDecrement={decrementActivityCycle}
								onIncrement={incrementActivityCycle}
							/>

							<ClubDongbangSection
								hasDongbang={formData.hasDongbang}
								location={formData.dongbangLocation}
								onHasDongbangChange={handleSetHasDongbang}
								onLocationChange={handleDongbangLocationChange}
							/>

							<ClubSnsInputList urls={formData.clubSNSUrls} onChange={handleSnsUrlsChange} />

							<ClubActivityImagePicker
								images={formData.activityImages}
								onChange={handleActivityImagesChange}
							/>

							<ClubDescriptionSection
								description={formData.clubDescription}
								onChange={handleDescriptionChange}
							/>
						</View>

						<ClubEditFooter
							paddingBottom={insets.bottom + vs(14)}
							disabled={!isComplete || !hasAnyChanges || isSubmitting}
							isSubmitting={isSubmitting}
							onSubmit={handleSubmit}
						/>
					</ScrollView>
				</>
			)}

			<DepartmentModal
				visible={showDepartmentDropdown}
				search={departmentSearch}
				options={filteredDepartmentOptions}
				selectedDepartment={formData.department}
				onClose={handleCloseDepartmentDropdown}
				onSearchChange={setDepartmentSearch}
				onSelect={handleSelectDepartment}
			/>

			<SuccessModal
				visible={showSuccessModal}
				title={
					fromClubRegistrationEdit
						? '신청 내용이 정상적으로 수정되었어요'
						: '동아리 정보가 정상적으로 수정되었어요'
				}
				onConfirm={handleConfirmSuccess}
			/>
		</SafeAreaView>
	)
}

export default ClubInfoEditScreen

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: Colors.WHITE,
	},
	header: {
		height: vs(39),
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: Colors.WHITE,
	},
	backBtn: {
		position: 'absolute',
		left: s(20),
		width: ms(24),
		height: ms(24),
		justifyContent: 'center',
		alignItems: 'center',
	},
	headerTitle: {
		fontFamily: 'Pretendard',
		fontWeight: '600',
		fontSize: ms(16),
		lineHeight: ms(19),
		letterSpacing: -0.02 * 16,
		color: Colors.BODYTEXT_SUB,
	},
	loadingContent: {
		flex: 1,
		backgroundColor: Colors.WHITE,
		justifyContent: 'center',
		alignItems: 'center',
	},
	scroll: {
		flex: 1,
		backgroundColor: Colors.WHITE,
	},
	content: {
		paddingHorizontal: s(20),
		paddingTop: vs(24),
		paddingBottom: vs(32),
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
	fieldLabel: {
		...typography.headerXLSemibold,
		color: Colors.BODYTEXT_SUB,
	},
	helperDescription: {
		...typography.bodySRegular,
		color: Colors.BODYTEXT_SUB,
	},
	imageUploadBox: {
		width: s(150),
		height: s(150),
		borderWidth: 1,
		borderColor: Colors.BODYTEXT_DISABLED,
		borderRadius: s(12),
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: Colors.WHITE,
		marginTop: vs(4),
		overflow: 'hidden',
	},
	uploadedImage: {
		width: '100%',
		height: '100%',
		borderRadius: s(11),
	},
	imageChangeButton: {
		alignSelf: 'flex-start',
		paddingVertical: vs(4),
	},
	imageChangeText: {
		...typography.bodyMRegular,
		color: Colors.POINTCOLOR,
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
	dropdownSearchInput: {
		...typography.bodyMRegular,
		color: Colors.BODYTEXT_MAIN,
		paddingHorizontal: s(16),
		paddingVertical: vs(10),
		borderBottomWidth: 1,
		borderBottomColor: Colors.BACKGROUND_SUB,
	},
	dropdownList: {
		maxHeight: vs(360),
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
	dropdownEmptyText: {
		...typography.bodyMRegular,
		color: Colors.BODYTEXT_DISABLED,
		paddingHorizontal: s(16),
		paddingVertical: vs(12),
	},
	departmentModalOverlay: {
		flex: 1,
		backgroundColor: Colors.BACKGROUND_DIM,
		justifyContent: 'center',
		paddingHorizontal: s(20),
	},
	departmentModalCard: {
		backgroundColor: Colors.WHITE,
		borderRadius: 12,
		overflow: 'hidden',
	},
	departmentModalTitle: {
		...typography.headerL,
		color: Colors.BODYTEXT_MAIN,
		paddingHorizontal: s(16),
		paddingTop: vs(16),
		paddingBottom: vs(8),
	},
	categoryGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: s(12),
	},
	categoryBlock: {
		width: TILE_SIZE,
		height: TILE_SIZE,
		borderRadius: s(12),
		borderWidth: 1,
		borderColor: Colors.BODYTEXT_DISABLED,
		backgroundColor: Colors.WHITE,
		alignItems: 'center',
		justifyContent: 'center',
	},
	categoryBlockSelected: {
		backgroundColor: Colors.BUTTON_SELECTED,
		borderColor: Colors.BUTTON_SELECTED,
	},
	categoryText: {
		...typography.bodyMMedium,
		color: Colors.BODYTEXT_DISABLED,
		textAlign: 'center',
	},
	categoryTextSelected: {
		color: Colors.TEXT_BUTTON_SELECTED,
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
		minHeight: vs(60),
		...typography.bodyMRegular,
		color: Colors.BODYTEXT_MAIN,
		paddingHorizontal: s(16),
		paddingVertical: vs(12),
		borderWidth: 1,
		borderColor: Colors.BODYTEXT_DISABLED,
		borderRadius: 8,
		backgroundColor: Colors.WHITE,
	},
	footer: {
		paddingTop: vs(24),
	},
	submitButton: {
		height: vs(48),
		borderRadius: 8,
		backgroundColor: Colors.BUTTON_SELECTED,
		justifyContent: 'center',
		alignItems: 'center',
	},
	submitButtonDisabled: {
		backgroundColor: Colors.BUTTON_UNSELECTED,
	},
	submitButtonText: {
		...typography.headerL,
		color: Colors.TEXT_BUTTON_SELECTED,
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: Colors.BACKGROUND_DIM,
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalCard: {
		width: ms(320),
		backgroundColor: Colors.WHITE,
		borderRadius: ms(12),
		padding: ms(24),
		gap: ms(24),
		alignItems: 'center',
	},
	modalContents: {
		alignSelf: 'stretch',
		alignItems: 'center',
		gap: ms(8),
	},
	modalTitle: {
		fontFamily: 'Apple SD Gothic Neo',
		fontWeight: '700',
		fontSize: ms(16),
		lineHeight: ms(24),
		color: Colors.BODYTEXT_MAIN,
		textAlign: 'center',
		alignSelf: 'stretch',
	},
	modalSingleBtn: {
		alignSelf: 'stretch',
		height: ms(44),
		backgroundColor: Colors.POINTCOLOR,
		borderRadius: ms(8),
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalConfirmText: {
		fontFamily: 'Apple SD Gothic Neo',
		fontWeight: '600',
		fontSize: ms(16),
		lineHeight: ms(20),
		color: Colors.WHITE,
	},
})
