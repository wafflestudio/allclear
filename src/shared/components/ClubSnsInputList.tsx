import React from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import { Colors } from '@/shared/constants/colors'
import { typography } from '@/shared/constants/typography'
import { MAX_CLUB_SNS_URLS } from '@/shared/utils/clubSns'
import { ms, s, vs } from '@/shared/utils/scale'

type Props = {
	urls: string[]
	onChange: (urls: string[]) => void
}

const ClubSnsInputList = ({ urls, onChange }: Props) => {
	const updateUrl = (index: number, value: string) => {
		onChange(urls.map((url, urlIndex) => (urlIndex === index ? value : url)))
	}

	const removeUrl = (index: number) => {
		if (urls.length <= 1) {
			return
		}
		onChange(urls.filter((_, urlIndex) => urlIndex !== index))
	}

	const addUrl = () => {
		if (urls.length >= MAX_CLUB_SNS_URLS) {
			return
		}
		onChange([...urls, ''])
	}

	return (
		<View style={styles.fieldWrapper}>
			<Text style={styles.fieldLabel}>동아리 SNS</Text>
			{urls.map((url, index) => (
				<View key={index} style={styles.inputRow}>
					<MaterialIcons name="link" size={ms(20)} color={Colors.BODYTEXT_DISABLED} />
					<TextInput
						style={styles.input}
						placeholder="url을 입력하세요"
						placeholderTextColor={Colors.BODYTEXT_DISABLED}
						value={url}
						onChangeText={value => updateUrl(index, value)}
						autoCapitalize="none"
						keyboardType="url"
						maxLength={200}
						accessibilityLabel={`동아리 SNS 링크 ${index + 1}`}
					/>
					{urls.length > 1 && (
						<Pressable
							style={styles.removeButton}
							onPress={() => removeUrl(index)}
							accessibilityRole="button"
							accessibilityLabel={`동아리 SNS 링크 ${index + 1} 삭제`}>
							<MaterialIcons name="close" size={ms(20)} color={Colors.BODYTEXT_SUB} />
						</Pressable>
					)}
				</View>
			))}
			{urls.length < MAX_CLUB_SNS_URLS && (
				<Pressable
					style={styles.addButton}
					onPress={addUrl}
					accessibilityRole="button"
					accessibilityLabel="동아리 SNS 링크 추가">
					<MaterialIcons name="add" size={ms(18)} color={Colors.POINTCOLOR} />
					<Text style={styles.addButtonText}>SNS 링크 추가</Text>
				</Pressable>
			)}
			<Text style={styles.helperText}>SNS 링크를 1개 이상 입력해주세요 (최대 3개)</Text>
		</View>
	)
}

export default React.memo(ClubSnsInputList)

const styles = StyleSheet.create({
	fieldWrapper: {
		gap: vs(8),
	},
	fieldLabel: {
		...typography.headerXLSemibold,
		color: Colors.BODYTEXT_SUB,
	},
	inputRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: s(8),
	},
	input: {
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
	removeButton: {
		width: ms(32),
		height: ms(32),
		alignItems: 'center',
		justifyContent: 'center',
	},
	addButton: {
		alignSelf: 'flex-start',
		flexDirection: 'row',
		alignItems: 'center',
		gap: s(4),
		paddingVertical: vs(4),
	},
	addButtonText: {
		...typography.bodyMMedium,
		color: Colors.POINTCOLOR,
	},
	helperText: {
		...typography.bodyMRegular,
		color: Colors.POINTCOLOR,
	},
})
