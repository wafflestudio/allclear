import React from 'react'
import { View, Text, ScrollView, StyleSheet, Pressable, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from '@/shared/constants/colors'
import { typography } from '@/shared/constants/typography'
import { s, vs } from '@/shared/utils/scale'
import { FormNavigationButtons } from '@/features/register-club/components/FormNavigationButtons'
import { RegisterClubFormData } from '@/features/register-club/types'
import { Category } from '@/entities/category'

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

const TILE_SIZE = (Dimensions.get('window').width - s(20) * 2 - s(12) * 2) / 3

type Props = {
	formData: RegisterClubFormData
	onFormDataChange: (data: Partial<RegisterClubFormData>) => void
	onNext: () => void
	onPrevious: () => void
	progress?: number
}

export const CategorySelectionScreen = ({
	formData,
	onFormDataChange,
	onNext,
	onPrevious,
	progress,
}: Props) => {
	const toggleCategory = (category: Category['name']) => {
		const isSelected = formData.selectedCategories.includes(category)
		const newCategories = isSelected
			? formData.selectedCategories.filter(c => c !== category)
			: [category]
		onFormDataChange({ selectedCategories: newCategories })
	}

	const isComplete = formData.selectedCategories.length > 0

	return (
		<SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
			<ScrollView contentContainerStyle={styles.content}>
				<View style={styles.header}>
					<Text style={styles.title}>
						<Text style={styles.clubName}>{formData.clubName}</Text>
						<Text>의</Text>
						{'\n'}
						<Text>카테고리를 선택해주세요</Text>
					</Text>
				</View>

				<View style={styles.categoryGrid}>
					{CATEGORIES.map(category => {
						const isSelected = formData.selectedCategories.includes(category)
						return (
							<Pressable
								key={category}
								style={[styles.categoryBlock, isSelected && styles.categoryBlockSelected]}
								onPress={() => toggleCategory(category)}>
								<Text style={[styles.categoryText, isSelected && styles.categoryTextSelected]}>
									{category}
								</Text>
							</Pressable>
						)
					})}
				</View>

				<View style={styles.footer}>
					<Text style={styles.helperText}>가장 적절한 한 가지 카테고리를 선택해주세요</Text>
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
	clubName: {
		color: Colors.BUTTON_SELECTED,
		fontWeight: '800',
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
	footer: {
		marginTop: vs(16),
	},
	helperText: {
		...typography.bodyMRegular,
		color: Colors.POINTCOLOR,
		textAlign: 'left',
	},
	categoryText: {
		...typography.bodyMMedium,
		color: Colors.BODYTEXT_DISABLED,
		textAlign: 'center',
	},
	categoryTextSelected: {
		color: Colors.TEXT_BUTTON_SELECTED,
	},
})
