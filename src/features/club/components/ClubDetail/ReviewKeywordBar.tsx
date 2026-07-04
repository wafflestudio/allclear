import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import { Colors } from '@/shared/constants/colors'
import { typography } from '@/shared/constants/typography'
import { ms, s, vs } from '@/shared/utils/scale'

type Props = {
	keyword: { iconUri: string; title: string; totalUpvotes: number }
	totalReviews: number
	themeColor: string
}

const ReviewKeywordBar = ({ keyword, totalReviews, themeColor }: Props) => {
	const ratio = totalReviews > 0 ? Math.min(Math.max(keyword.totalUpvotes / totalReviews, 0), 1) : 0

	return (
		<View style={[styles.bar, { borderColor: themeColor }]}>
			<LinearGradient
				pointerEvents="none"
				colors={[`${themeColor}40`, `${themeColor}00`]}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 0 }}
				style={[styles.fill, { width: `${ratio * 100}%` }]}
			/>
			<View style={styles.content}>
				<View style={styles.left}>
					<Text style={[styles.icon, typography.bodySMedium]}>{keyword.iconUri?.trim()}</Text>
					<Text style={[styles.title, typography.bodySMedium]} numberOfLines={1}>
						{keyword.title}
					</Text>
				</View>
				<Text style={[styles.count, typography.bodySMedium]}>{keyword.totalUpvotes}</Text>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	bar: {
		height: vs(31),
		borderRadius: ms(24),
		borderWidth: 0.5,
		backgroundColor: Colors.WHITE,
		overflow: 'hidden',
		justifyContent: 'center',
	},
	fill: {
		position: 'absolute',
		top: 0,
		bottom: 0,
		left: 0,
	},
	content: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingLeft: s(15),
		paddingRight: s(20),
	},
	left: {
		flexDirection: 'row',
		alignItems: 'center',
		flexShrink: 1,
	},
	icon: {
		marginRight: s(4),
	},
	title: {
		color: Colors.BODYTEXT_SUB,
		flexShrink: 1,
	},
	count: {
		color: Colors.BODYTEXT_SUB,
		marginLeft: s(8),
	},
})

export default ReviewKeywordBar
