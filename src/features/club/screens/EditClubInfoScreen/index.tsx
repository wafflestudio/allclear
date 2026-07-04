import React, { useContext, useEffect, useRef, useState } from 'react'
import {
	Dimensions,
	Image,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { RouteProp, useRoute } from '@react-navigation/native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { launchImageLibrary } from 'react-native-image-picker'
import Toast from 'react-native-toast-message'
import Icon from 'react-native-vector-icons/MaterialIcons'

import { Category } from '@/entities/category'
import AlertModal from '@/shared/components/AlertModal'
import TextField from '@/shared/components/TextField'
import { Colors } from '@/shared/constants/colors'
import { SCREEN_TYPE, StackParamList } from '@/shared/constants/screen'
import { typography } from '@/shared/constants/typography'
import { serviceContext } from '@/shared/contexts/serviceContext'
import { navigation } from '@/shared/utils/navigation'
import { ms, s, vs } from '@/shared/utils/scale'

const RECRUIT_TYPES = ['정기', '상시', '미정']

const CATEGORY_TILE_SIZE = (Dimensions.get('window').width - s(20) * 2 - s(12) * 2) / 3

const CATEGORIES: Category['name'][] = [
	'학술',
	'종교',
	'봉사',
	'공연',
	'운동',
	'홍보',
	'취미',
	'문화',
	'진로',
]

type RouteProps = RouteProp<StackParamList, typeof SCREEN_TYPE.EDIT_CLUB_INFO>

type EditClubForm = {
	name: string
	type: string
	imageUri: string
	category: Category['name'] | ''
	affiliation: string
	shortDescription: string
	recruitType: string
	minActivityPeriod: number
	hasDongbang: boolean
	dongbangLocation: string
	sns: string
	introduction: string
}

const EMPTY_FORM: EditClubForm = {
	name: '',
	type: '',
	imageUri: '',
	category: '',
	affiliation: '',
	shortDescription: '',
	recruitType: '',
	minActivityPeriod: 0,
	hasDongbang: false,
	dongbangLocation: '',
	sns: '',
	introduction: '',
}

const EditClubInfoScreen = () => {
	const route = useRoute<RouteProps>()
	const { clubId } = route.params

	const { clubService } = useContext(serviceContext)
	const queryClient = useQueryClient()

	const [form, setForm] = useState<EditClubForm>(EMPTY_FORM)
	const [activityMode, setActivityMode] = useState<'none' | 'number'>('none')
	const [showConfirm, setShowConfirm] = useState(false)
	const [showSuccess, setShowSuccess] = useState(false)
	const initializedRef = useRef(false)

	const { data: club } = useQuery({
		queryKey: ['managedClub', clubId],
		queryFn: () => clubService.getManagedClubDetail({ uuid: clubId }),
	})

	useEffect(() => {
		if (!club || initializedRef.current) return
		initializedRef.current = true

		const period = club.minActivityPeriod ?? (Number.parseInt(club.activityCycle ?? '', 10) || 0)
		setActivityMode(period > 0 ? 'number' : 'none')
		setForm({
			name: club.name ?? '',
			type: club.type ?? '',
			imageUri: club.imageUri ?? '',
			category: club.category ?? '',
			affiliation: club.affiliation ?? club.college ?? '',
			shortDescription: club.shortDescription ?? club.description ?? '',
			recruitType: club.recruitType ?? '',
			minActivityPeriod: period,
			hasDongbang: club.hasDongbang ?? false,
			dongbangLocation: club.dongbangLocation ?? '',
			sns: club.sns ?? '',
			introduction: club.introduction ?? '',
		})
	}, [club])

	const update = (patch: Partial<EditClubForm>) => setForm(prev => ({ ...prev, ...patch }))

	const handleChangeImage = async () => {
		const result = await launchImageLibrary({
			mediaType: 'photo',
			selectionLimit: 1,
			includeBase64: false,
		})

		if (result.didCancel) return

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

		const uri = result.assets?.[0]?.uri
		if (uri) update({ imageUri: uri })
	}

	const setHasDongbang = (value: boolean) => {
		update(value ? { hasDongbang: true } : { hasDongbang: false, dongbangLocation: '' })
	}

	const handleActivityMode = (mode: 'none' | 'number') => {
		setActivityMode(mode)
		if (mode === 'none') update({ minActivityPeriod: 0 })
	}

	const incrementPeriod = () => {
		setActivityMode('number')
		update({ minActivityPeriod: form.minActivityPeriod + 1 })
	}

	const decrementPeriod = () => {
		if (form.minActivityPeriod > 0) update({ minActivityPeriod: form.minActivityPeriod - 1 })
	}

	const { mutate: submit, isLoading: isSubmitting } = useMutation({
		mutationFn: () =>
			clubService.updateManagedClub({
				uuid: clubId,
				body: {
					name: form.name,
					type: form.type,
					image_uri: form.imageUri,
					category: form.category,
					affiliation: form.affiliation,
					short_description: form.shortDescription,
					recruit_type: form.recruitType,
					min_activity_period: form.minActivityPeriod,
					has_dongbang: form.hasDongbang,
					dongbang_location: form.hasDongbang ? form.dongbangLocation : '',
					sns: form.sns,
					introduction: form.introduction,
				},
			}),
		onSuccess: () => {
			setShowConfirm(false)
			queryClient.invalidateQueries({ queryKey: ['managedClub', clubId] })
			queryClient.invalidateQueries({ queryKey: ['clubs', clubId] })
			queryClient.invalidateQueries({ queryKey: ['manageClubs'] })
			setShowSuccess(true)
		},
		onError: () => {
			setShowConfirm(false)
			Toast.show({
				type: 'error',
				text1: '동아리 정보 수정에 실패했어요',
				text2: '잠시 후 다시 시도해주세요',
				position: 'top',
				topOffset: 60,
				visibilityTime: 2000,
			})
		},
	})

	return (
		<SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
			{/* 헤더 */}
			<View style={styles.header}>
				<Pressable style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={8}>
					<Icon name="chevron-left" size={ms(24)} color="#757474" />
				</Pressable>
				<Text style={styles.headerTitle}>동아리 정보 수정</Text>
			</View>

			<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
				{/* 대표 이미지 */}
				<View style={styles.fieldWrapper}>
					<Text style={styles.label}>대표 이미지</Text>
					<Text style={styles.helperDescription}>4X4 정방형 이미지를 권장드려요</Text>
					<Pressable style={styles.imageUploadBox} onPress={handleChangeImage}>
						{form.imageUri ? (
							<>
								<Image source={{ uri: form.imageUri }} style={styles.uploadedImage} />
								<View style={styles.imageOverlay}>
									<View style={styles.imageOverlayPill}>
										<Text style={styles.imageOverlayText}>이미지 변경</Text>
									</View>
								</View>
							</>
						) : (
							<Icon name="add" size={s(40)} color={Colors.BODYTEXT_DISABLED} />
						)}
					</Pressable>
				</View>

				{/* 동아리명 */}
				<View style={styles.fieldWrapper}>
					<Text style={styles.label}>동아리명</Text>
					<TextField
						placeholder="와플스튜디오"
						value={form.name}
						onChangeText={text => update({ name: text })}
						maxLength={100}
					/>
				</View>

				{/* 한줄소개 */}
				<View style={styles.fieldWrapper}>
					<Text style={styles.label}>한줄소개</Text>
					<View style={styles.affiliationRow}>
						<TextField
							placeholder="컴퓨터공학부"
							value={form.affiliation}
							onChangeText={text => update({ affiliation: text })}
							maxLength={100}
						/>
						<Text style={styles.affiliationLabel}>소속</Text>
					</View>
					<View style={styles.affiliationRow}>
						<TextField
							placeholder="웹/앱 개발"
							value={form.shortDescription}
							onChangeText={text => update({ shortDescription: text })}
							maxLength={100}
						/>
						<Text style={styles.affiliationLabel}>동아리</Text>
					</View>
				</View>

				{/* 카테고리 */}
				<View style={styles.fieldWrapper}>
					<Text style={styles.label}>카테고리</Text>
					<View style={styles.categoryGrid}>
						{CATEGORIES.map(category => {
							const isSelected = form.category === category
							return (
								<Pressable
									key={category}
									style={[styles.categoryBlock, isSelected && styles.categoryBlockSelected]}
									onPress={() => update({ category })}>
									<Text style={[styles.categoryText, isSelected && styles.categoryTextSelected]}>
										{category}
									</Text>
								</Pressable>
							)
						})}
					</View>
				</View>

				{/* 모집 형태 */}
				<View style={styles.fieldWrapper}>
					<Text style={styles.label}>모집 형태</Text>
					<View style={styles.buttonGroup}>
						{RECRUIT_TYPES.map(type => (
							<Pressable
								key={type}
								style={[styles.typeButton, form.recruitType === type && styles.typeButtonSelected]}
								onPress={() => update({ recruitType: type })}>
								<Text
									style={[
										styles.typeButtonText,
										form.recruitType === type && styles.typeButtonTextSelected,
									]}>
									{type}
								</Text>
							</Pressable>
						))}
					</View>
				</View>

				{/* (최소) 활동 기간 */}
				<View style={styles.fieldWrapper}>
					<Text style={styles.label}>(최소) 활동 기간</Text>
					<View style={styles.periodRow}>
						<View style={styles.modeButtons}>
							<Pressable
								style={[styles.typeButton, activityMode === 'none' && styles.typeButtonSelected]}
								onPress={() => handleActivityMode('none')}>
								<Text
									style={[
										styles.typeButtonText,
										activityMode === 'none' && styles.typeButtonTextSelected,
									]}>
									없음
								</Text>
							</Pressable>
							<Pressable
								style={[styles.typeButton, activityMode === 'number' && styles.typeButtonSelected]}
								onPress={() => handleActivityMode('number')}>
								<Text
									style={[
										styles.typeButtonText,
										activityMode === 'number' && styles.typeButtonTextSelected,
									]}>
									있음
								</Text>
							</Pressable>
						</View>

						<View style={styles.periodStepper}>
							<Text style={styles.semesterValue}>{form.minActivityPeriod}학기</Text>
							<View style={styles.stepperPill}>
								<Pressable style={styles.stepperButton} onPress={decrementPeriod}>
									<Icon name="remove" size={18} color={Colors.BODYTEXT_SUB} />
								</Pressable>
								<View style={styles.stepperDivider} />
								<Pressable style={styles.stepperButton} onPress={incrementPeriod}>
									<Icon name="add" size={18} color={Colors.BODYTEXT_SUB} />
								</Pressable>
							</View>
						</View>
					</View>
				</View>

				{/* 동방 보유 여부 */}
				<View style={styles.fieldWrapper}>
					<Text style={styles.label}>동방 보유 여부</Text>
					<View style={styles.buttonGroup}>
						<Pressable
							style={[styles.typeButton, form.hasDongbang && styles.typeButtonSelected]}
							onPress={() => setHasDongbang(true)}>
							<Text
								style={[styles.typeButtonText, form.hasDongbang && styles.typeButtonTextSelected]}>
								보유
							</Text>
						</Pressable>
						<Pressable
							style={[styles.typeButton, !form.hasDongbang && styles.typeButtonSelected]}
							onPress={() => setHasDongbang(false)}>
							<Text
								style={[styles.typeButtonText, !form.hasDongbang && styles.typeButtonTextSelected]}>
								미보유
							</Text>
						</Pressable>
					</View>

					{form.hasDongbang && (
						<View style={styles.iconInputRow}>
							<Icon name="location-on" size={20} color={Colors.BODYTEXT_DISABLED} />
							<TextInput
								style={styles.iconInput}
								placeholder="활동 장소를 입력하세요"
								placeholderTextColor={Colors.BODYTEXT_DISABLED}
								value={form.dongbangLocation}
								onChangeText={text => update({ dongbangLocation: text })}
								maxLength={100}
							/>
						</View>
					)}
				</View>

				{/* 동아리 SNS */}
				<View style={styles.fieldWrapper}>
					<Text style={styles.label}>동아리 SNS</Text>
					<View style={styles.iconInputRow}>
						<Icon name="link" size={20} color={Colors.BODYTEXT_DISABLED} />
						<TextInput
							style={styles.iconInput}
							placeholder="url을 입력하세요"
							placeholderTextColor={Colors.BODYTEXT_DISABLED}
							value={form.sns}
							onChangeText={text => update({ sns: text })}
							autoCapitalize="none"
							keyboardType="url"
							maxLength={200}
						/>
					</View>
				</View>

				{/* 동아리 추가 설명 */}
				<View style={styles.fieldWrapper}>
					<Text style={styles.label}>동아리 추가 설명</Text>
					<TextInput
						style={styles.descriptionInput}
						placeholder="동아리에 대해 자세히 설명해주세요"
						placeholderTextColor={Colors.BODYTEXT_DISABLED}
						value={form.introduction}
						onChangeText={text => update({ introduction: text })}
						multiline
						maxLength={500}
					/>
				</View>

				<Pressable
					style={styles.submitButton}
					onPress={() => setShowConfirm(true)}
					disabled={isSubmitting}>
					<Text style={styles.submitButtonText}>수정</Text>
				</Pressable>
			</ScrollView>

			{/* 수정 확인 모달 */}
			<AlertModal
				visible={showConfirm}
				onClose={() => setShowConfirm(false)}
				title="동아리 정보를 수정할까요?"
				description={'동아리 정보는 동아리 관리 → 수정 탭에서\n언제든 수정 가능해요'}
				buttonLabel="수정"
				onButtonPress={() => {
					if (!isSubmitting) submit()
				}}
				hasCancel
				cancelLabel="취소"
				dismissOnBackdropPress={!isSubmitting}
			/>

			{/* 수정 완료 모달 */}
			<AlertModal
				visible={showSuccess}
				onClose={() => {
					setShowSuccess(false)
					navigation.goBack()
				}}
				title="동아리 정보가 정상적으로 수정되었어요"
				buttonLabel="확인"
				onButtonPress={() => {
					setShowSuccess(false)
					navigation.goBack()
				}}
				dismissOnBackdropPress={false}
			/>
		</SafeAreaView>
	)
}

export default EditClubInfoScreen

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: Colors.WHITE,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: s(20),
		height: vs(39),
	},
	backBtn: {
		width: ms(24),
		height: ms(24),
		justifyContent: 'center',
		alignItems: 'center',
	},
	headerTitle: {
		flex: 1,
		textAlign: 'center',
		marginRight: ms(24),
		...typography.headerL,
		color: '#757474',
	},
	content: {
		padding: s(20),
		paddingBottom: vs(40),
		gap: vs(24),
	},
	fieldWrapper: {
		gap: vs(8),
	},
	label: {
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
	imageOverlay: {
		...StyleSheet.absoluteFillObject,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(0,0,0,0.25)',
	},
	imageOverlayPill: {
		paddingHorizontal: s(12),
		paddingVertical: vs(6),
		borderRadius: s(100),
		backgroundColor: Colors.BUTTON_SELECTED,
	},
	imageOverlayText: {
		...typography.bodySMedium,
		color: Colors.TEXT_BUTTON_SELECTED,
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
	categoryGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: s(12),
	},
	categoryBlock: {
		width: CATEGORY_TILE_SIZE,
		height: CATEGORY_TILE_SIZE,
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
		...typography.bodyMRegular,
		color: Colors.BODYTEXT_MAIN,
		minHeight: vs(80),
		textAlignVertical: 'top',
		paddingHorizontal: s(16),
		paddingVertical: vs(8),
		borderWidth: 1,
		borderColor: Colors.BODYTEXT_DISABLED,
		borderRadius: 8,
		backgroundColor: Colors.WHITE,
	},
	submitButton: {
		marginTop: vs(8),
		paddingVertical: vs(16),
		borderRadius: 12,
		backgroundColor: Colors.BUTTON_SELECTED,
		alignItems: 'center',
		justifyContent: 'center',
	},
	submitButtonText: {
		...typography.headerL,
		color: Colors.TEXT_BUTTON_SELECTED,
	},
})
