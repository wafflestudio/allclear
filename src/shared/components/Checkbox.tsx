import React from 'react'
import { Pressable, StyleProp, StyleSheet, Text, View, TextStyle, ViewStyle } from 'react-native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { Colors } from '@/shared/constants/colors'
import { typography } from '@/shared/constants/typography'

type Props = {
	label: string
	checked: boolean
	onPressIn: () => void
	style?: StyleProp<ViewStyle>
	textStyle?: StyleProp<TextStyle>
}

const Checkbox = ({ label, checked, onPressIn, style, textStyle }: Props) => {
	return (
		<Pressable
			accessibilityRole="checkbox"
			hitSlop={14}
			onPressIn={onPressIn}
			style={({ pressed }) => [styles.container, pressed && styles.pressed, style]}>
			<View style={styles.iconContainer}>
				<Icon
					color={Colors.POINTCOLOR}
					name={checked ? 'checkbox-marked-outline' : 'checkbox-blank-outline'}
					size={14}
				/>
			</View>
			<Text style={[styles.label, checked && styles.labelChecked, textStyle]}>{label}</Text>
		</Pressable>
	)
}

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: 4,
	},
	pressed: {
		opacity: 0.7,
	},
	iconContainer: {
		alignItems: 'center',
		height: 14,
		justifyContent: 'center',
		width: 14,
	},
	label: {
		...typography.bodySSemibold,
		color: Colors.POINTCOLOR,
	},
	labelChecked: {
		color: Colors.POINTCOLOR,
	},
})

export default Checkbox
