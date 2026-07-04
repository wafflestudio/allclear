import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { Colors } from '@/shared/constants/colors'
import { typography } from '@/shared/constants/typography'
import { ms, s, vs } from '@/shared/utils/scale'

type Props = {
	keyword: { iconUri: string; title: string }
	themeColor: string
	backgroundColor: string
}

const ReviewKeywordPill = ({ keyword, themeColor, backgroundColor }: Props) => {
	return (
		<View style={[styles.pill, { borderColor: themeColor, backgroundColor }]}>
			<Text style={[styles.text, styles.icon]}>{keyword.iconUri?.trim()}</Text>
			<Text style={[styles.title, styles.text]} numberOfLines={1}>
				{keyword.title}
			</Text>
		</View>
	)
}

const styles = StyleSheet.create({
	pill: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: ms(24),
		borderWidth: 0.5,
		flexShrink: 1,
		minHeight: vs(20),
		paddingHorizontal: s(6),
		paddingTop: vs(4),
		paddingBottom: vs(5),
	},
	text: typography.bodyXSRegular,
	icon: {
		fontSize: ms(8.5),
		marginRight: s(4),
	},
	title: {
		color: Colors.BODYTEXT_SUB,
		flexShrink: 1,
	},
})

export default ReviewKeywordPill
