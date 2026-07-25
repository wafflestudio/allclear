import React from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { launchImageLibrary } from 'react-native-image-picker'
import Toast from 'react-native-toast-message'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { Colors } from '@/shared/constants/colors'
import { typography } from '@/shared/constants/typography'
import type { EditableImage } from '@/shared/types/image'
import { isActivityImageFileSizeAllowed } from '@/shared/utils/activityImage'
import { ms, s, vs } from '@/shared/utils/scale'

const MAX_ACTIVITY_IMAGES = 5

type Props = {
	images: EditableImage[]
	onChange: (images: EditableImage[]) => void
}

const ClubActivityImagePicker = ({ images, onChange }: Props) => {
	const remainingCount = MAX_ACTIVITY_IMAGES - images.length

	const handleAddImages = async () => {
		if (remainingCount <= 0) return

		const result = await launchImageLibrary({
			mediaType: 'photo',
			selectionLimit: remainingCount,
			includeBase64: false,
		})

		if (result.didCancel) return
		if (result.errorCode) {
			Toast.show({
				type: 'error',
				text1: '활동 사진을 불러오지 못했어요',
				text2: result.errorMessage,
				position: 'top',
			})
			return
		}

		const assets = result.assets ?? []
		const oversizedImageCount = assets.filter(
			asset => !isActivityImageFileSizeAllowed(asset.fileSize),
		).length
		const selectedImages: EditableImage[] = assets.flatMap((asset, index) => {
			if (!isActivityImageFileSizeAllowed(asset.fileSize)) return []
			if (!asset.uri) return []
			const name = asset.fileName ?? `club_activity_${Date.now()}_${index}.jpg`
			return [
				{
					id: `local-${Date.now()}-${index}`,
					uri: asset.uri,
					file: {
						uri: asset.uri,
						type: asset.type ?? 'image/jpeg',
						name,
					},
				},
			]
		})

		if (oversizedImageCount > 0) {
			Toast.show({
				type: 'error',
				text1: '10MB 이하 사진만 등록할 수 있어요',
				text2: `${oversizedImageCount}장의 활동 사진을 제외했어요`,
				position: 'top',
			})
		}

		if (selectedImages.length > 0) {
			onChange([...images, ...selectedImages].slice(0, MAX_ACTIVITY_IMAGES))
		}
	}

	return (
		<View style={styles.wrapper}>
			<View style={styles.labelRow}>
				<Text style={styles.label}>활동 사진 (선택)</Text>
				<Text style={styles.count}>
					{images.length}/{MAX_ACTIVITY_IMAGES}
				</Text>
			</View>
			<Text style={styles.helper}>동아리 활동 모습을 최대 5장까지 등록할 수 있어요</Text>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.list}>
				{images.map(image => (
					<View key={image.id} style={styles.imageWrapper}>
						<Image source={{ uri: image.uri }} style={styles.image} />
						<Pressable
							accessibilityRole="button"
							accessibilityLabel="활동 사진 삭제"
							style={styles.removeButton}
							onPress={() => onChange(images.filter(item => item.id !== image.id))}>
							<Icon name="close" size={ms(16)} color={Colors.WHITE} />
						</Pressable>
					</View>
				))}
				{remainingCount > 0 && (
					<Pressable
						accessibilityRole="button"
						accessibilityLabel="활동 사진 추가"
						style={styles.addButton}
						onPress={handleAddImages}>
						<Icon name="add-photo-alternate" size={ms(28)} color={Colors.BODYTEXT_DISABLED} />
						<Text style={styles.addText}>사진 추가</Text>
					</Pressable>
				)}
			</ScrollView>
		</View>
	)
}

export default ClubActivityImagePicker

const styles = StyleSheet.create({
	wrapper: { gap: vs(8) },
	labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
	label: { ...typography.headerXLSemibold, color: Colors.BODYTEXT_SUB },
	count: { ...typography.bodySRegular, color: Colors.BODYTEXT_SUB_2 },
	helper: { ...typography.bodySRegular, color: Colors.BODYTEXT_SUB },
	list: { gap: s(10), paddingVertical: vs(4) },
	imageWrapper: { width: s(104), height: s(104) },
	image: { width: '100%', height: '100%', borderRadius: s(10) },
	removeButton: {
		position: 'absolute',
		top: s(4),
		right: s(4),
		width: ms(28),
		height: ms(28),
		borderRadius: ms(14),
		backgroundColor: Colors.BODYTEXT_MAIN,
		alignItems: 'center',
		justifyContent: 'center',
	},
	addButton: {
		width: s(104),
		height: s(104),
		borderWidth: 1,
		borderColor: Colors.BODYTEXT_DISABLED,
		borderRadius: s(10),
		alignItems: 'center',
		justifyContent: 'center',
		gap: vs(4),
	},
	addText: { ...typography.bodySRegular, color: Colors.BODYTEXT_SUB },
})
