import React from 'react'
import { View, Text, ScrollView, StyleSheet, Pressable, Image } from 'react-native'
import { launchImageLibrary } from 'react-native-image-picker'
import Toast from 'react-native-toast-message'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from '@/shared/constants/colors'
import { typography } from '@/shared/constants/typography'
import { s, vs } from '@/shared/utils/scale'
import TextField from '@/shared/components/TextField'
import { FormNavigationButtons } from '@/features/register-club/components/FormNavigationButtons'
import { RegisterClubFormData } from '@/features/register-club/types'
import Icon from 'react-native-vector-icons/MaterialIcons'

type Props = {
	formData: RegisterClubFormData
	onFormDataChange: (data: Partial<RegisterClubFormData>) => void
	onNext: () => void
	onPrevious: () => void
	progress?: number
}

export const ClubBasicInfoScreen = ({
	formData,
	onFormDataChange,
	onNext,
	onPrevious,
	progress,
}: Props) => {
	const isComplete = formData.clubName.trim()

	const handleAddImage = async () => {
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

		const uri = result.assets?.[0]?.uri
		if (uri) {
			onFormDataChange({ clubImage: uri })
		}
	}

	return (
		<SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
			<ScrollView contentContainerStyle={styles.content}>
				<View style={styles.header}>
					<Text style={styles.title}>
						<Text>신규 등록할</Text>
						{'\n'}
						<Text>동아리 기본 정보를 입력해주세요</Text>
					</Text>
				</View>

				<View style={styles.form}>
					<View style={styles.fieldWrapper}>
						<Text style={styles.label}>동아리 대표 이미지</Text>
						<Text style={styles.helperDescription}>4X4 정방형 이미지를 권장드려요</Text>
						<Pressable style={styles.imageUploadBox} onPress={handleAddImage}>
							{formData.clubImage ? (
								<Image source={{ uri: formData.clubImage }} style={styles.uploadedImage} />
							) : (
								<Icon name="add" size={s(40)} color={Colors.BODYTEXT_DISABLED} />
							)}
						</Pressable>
						{!formData.clubImage && (
							<Text style={styles.validationText}>대표 이미지를 등록해주세요</Text>
						)}
					</View>

					<View style={styles.fieldWrapper}>
						<Text style={styles.label}>동아리명</Text>
						<TextField
							placeholder="와플스튜디오"
							value={formData.clubName}
							onChangeText={text => onFormDataChange({ clubName: text })}
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
	helperDescription: {
		...typography.bodySRegular,
		color: Colors.BODYTEXT_SUB,
	},
	validationText: {
		...typography.bodyMRegular,
		color: Colors.POINTCOLOR,
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
	},
	uploadedImage: {
		width: '100%',
		height: '100%',
		borderRadius: s(11),
	},
})
