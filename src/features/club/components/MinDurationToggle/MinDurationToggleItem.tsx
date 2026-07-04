import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Colors } from '@/shared/constants/colors'
import { ms } from '@/shared/utils/scale'
import { THUMB_SIZE } from './useMinDurationToggle'

type MinDurationToggleItemProps = {
	centerX: number
	selected: boolean
	onPress?: () => void
}

const STEP_DOT_SIZE = ms(12)
const STEP_DOT_SELECTED_SIZE = ms(16)
const STEP_DOT_BORDER_WIDTH = 2
const STEP_DOT_INNER_SIZE = ms(8)

export const MinDurationToggleItem = ({
	centerX,
	selected,
	onPress,
}: MinDurationToggleItemProps) => (
	<Pressable
		hitSlop={8}
		onPress={onPress}
		style={[
			styles.stepDot,
			selected && styles.stepDotSelected,
			{
				left: centerX - (selected ? STEP_DOT_SELECTED_SIZE : STEP_DOT_SIZE) / 2,
			},
		]}>
		{selected ? <View style={styles.stepDotInner} /> : null}
	</Pressable>
)

const styles = StyleSheet.create({
	stepDot: {
		alignItems: 'center',
		backgroundColor: Colors.WHITE,
		borderColor: Colors.GRAY,
		borderRadius: STEP_DOT_SIZE / 2,
		borderWidth: STEP_DOT_BORDER_WIDTH,
		height: STEP_DOT_SIZE,
		justifyContent: 'center',
		position: 'absolute',
		top: (THUMB_SIZE - STEP_DOT_SIZE) / 2,
		width: STEP_DOT_SIZE,
		zIndex: 1,
	},
	stepDotSelected: {
		borderColor: Colors.POINTCOLOR,
		borderRadius: STEP_DOT_SELECTED_SIZE / 2,
		height: STEP_DOT_SELECTED_SIZE,
		top: (THUMB_SIZE - STEP_DOT_SELECTED_SIZE) / 2,
		width: STEP_DOT_SELECTED_SIZE,
	},
	stepDotInner: {
		backgroundColor: Colors.POINTCOLOR,
		borderRadius: STEP_DOT_INNER_SIZE / 2,
		height: STEP_DOT_INNER_SIZE,
		width: STEP_DOT_INNER_SIZE,
	},
})
