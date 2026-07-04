import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { Colors } from '@/shared/constants/colors'
import { typography } from '@/shared/constants/typography'
import { ms, s, vs } from '@/shared/utils/scale'

type Props = {
	searches: string[]
	onPressItem: (query: string) => void
	onClearAll: () => void
}

const RecentSearches = ({ searches, onPressItem, onClearAll }: Props) => {
	const isEmpty = searches.length === 0

	return (
		<View style={styles.container}>
			<View style={styles.headerRow}>
				<Text style={styles.headerText}>최근 검색어</Text>
				{!isEmpty && (
					<Pressable onPress={onClearAll} hitSlop={8} style={styles.clearButton}>
						<Text style={styles.clearText}>검색내역 지우기</Text>
					</Pressable>
				)}
			</View>

			{isEmpty ? (
				<Text style={styles.emptyText}>
					최근 검색한 내역이 없어요. 새로운 동아리를 탐색해보세요!
				</Text>
			) : (
				<View style={styles.chipWrap}>
					{searches.map(query => (
						<Pressable key={query} style={styles.chip} onPress={() => onPressItem(query)}>
							<Text style={styles.chipText}>{query}</Text>
						</Pressable>
					))}
				</View>
			)}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		width: '100%',
		minHeight: vs(100),
		gap: vs(9),
	},
	headerRow: {
		flexDirection: 'row',
		width: s(350),
		paddingHorizontal: s(5),
		paddingVertical: vs(5),
		alignItems: 'center',
		gap: s(10),
	},
	headerText: {
		flex: 1,
		...typography.headerXLSemibold,
		color: Colors.BODYTEXT_SUB,
	},
	clearButton: {
		paddingTop: vs(5),
		paddingBottom: vs(1),
	},
	clearText: {
		...typography.bodySRegular,
		color: Colors.BODYTEXT_SUB,
	},
	emptyText: {
		...typography.bodySRegular,
		color: Colors.BODYTEXT_SUB,
		textAlign: 'left',
		paddingLeft: s(6),
	},
	chipWrap: {
		flexDirection: 'row',
		flexWrap: 'wrap',
	},
	chip: {
		height: vs(24),
		alignItems: 'center',
		justifyContent: 'center',
		marginLeft: s(8),
		marginBottom: vs(8),
		paddingHorizontal: s(10),
		paddingVertical: vs(6),
		borderRadius: ms(20),
		borderWidth: 0.3,
		borderColor: Colors.POINTCOLOR,
		backgroundColor: 'rgba(135, 79, 255, 0.1)',
	},
	chipText: {
		...typography.bodySRegular,
		lineHeight: vs(12),
		color: Colors.BODYTEXT_SUB,
	},
})

export default RecentSearches
