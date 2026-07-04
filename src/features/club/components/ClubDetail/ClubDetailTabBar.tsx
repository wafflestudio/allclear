import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { Colors } from '@/shared/constants/colors'
import { typography } from '@/shared/constants/typography'
import { ms, s, vs } from '@/shared/utils/scale'

export const CLUB_DETAIL_TABS = {
	detail: '상세정보',
	recruit: '모집공고',
	review: '활동후기',
} as const

export type ClubDetailTabKey = keyof typeof CLUB_DETAIL_TABS
export type ClubDetailTabLabel = (typeof CLUB_DETAIL_TABS)[ClubDetailTabKey]

type Props = {
	activeKey: ClubDetailTabKey
	onChange: (key: ClubDetailTabKey) => void
}

const ClubDetailTabBar = ({ activeKey, onChange }: Props) => {
	return (
		<View style={styles.container}>
			{(Object.keys(CLUB_DETAIL_TABS) as ClubDetailTabKey[]).map(key => {
				const isActive = key === activeKey
				return (
					<Pressable key={key} style={styles.tab} onPress={() => onChange(key)} hitSlop={8}>
						<Text style={[styles.label, isActive ? styles.labelActive : styles.labelInactive]}>
							{CLUB_DETAIL_TABS[key]}
						</Text>
						<View style={[styles.underline, isActive && styles.underlineActive]} />
					</Pressable>
				)
			})}
		</View>
	)
}

export default ClubDetailTabBar

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		backgroundColor: Colors.BACKGROUND_MAIN,
		borderBottomWidth: 1,
		borderBottomColor: Colors.BODYTEXT_SUB_2,
	},
	tab: {
		flex: 1,
		alignItems: 'center',
		paddingVertical: vs(12),
	},
	label: {
		marginBottom: vs(4),
	},
	labelActive: {
		...typography.bodyMSemibold,
		color: Colors.POINTCOLOR,
	},
	labelInactive: {
		...typography.bodyMMedium,
		color: Colors.BODYTEXT_SUB,
	},
	underline: {
		position: 'absolute',
		bottom: -1,
		left: s(16),
		right: s(16),
		height: ms(2),
		borderRadius: ms(2),
		backgroundColor: 'transparent',
	},
	underlineActive: {
		backgroundColor: Colors.POINTCOLOR,
	},
})
