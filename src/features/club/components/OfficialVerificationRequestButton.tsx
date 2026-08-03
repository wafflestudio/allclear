import React from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'

import { OfficialVerificationStatus } from '@/entities/club'
import { getOfficialVerificationButtonState } from '@/features/club/utils/officialVerificationRequest'
import { Colors } from '@/shared/constants/colors'
import { typography } from '@/shared/constants/typography'
import { ms, vs } from '@/shared/utils/scale'

type Props = {
	status?: OfficialVerificationStatus
	isStatusLoading: boolean
	isRequesting: boolean
	onPress: () => void
}

const OfficialVerificationRequestButton = ({
	status,
	isStatusLoading,
	isRequesting,
	onPress,
}: Props) => {
	const buttonState = getOfficialVerificationButtonState({
		status,
		isStatusLoading,
		isRequesting,
	})

	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={buttonState.label}
			accessibilityState={{ disabled: buttonState.disabled, busy: isRequesting }}
			disabled={buttonState.disabled}
			onPress={onPress}
			style={({ pressed }) => [
				styles.button,
				buttonState.disabled && styles.buttonDisabled,
				pressed && !buttonState.disabled && styles.buttonPressed,
			]}>
			<Text style={[styles.label, buttonState.disabled && styles.labelDisabled]}>
				{buttonState.label}
			</Text>
		</Pressable>
	)
}

export default OfficialVerificationRequestButton

const styles = StyleSheet.create({
	button: {
		width: '100%',
		height: vs(44),
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: ms(12),
		backgroundColor: Colors.BUTTON_SELECTED,
	},
	buttonDisabled: {
		backgroundColor: Colors.BUTTON_UNSELECTED,
	},
	buttonPressed: {
		backgroundColor: Colors.BUTTON_PUSH,
	},
	label: {
		...typography.bodyMSemibold,
		color: Colors.TEXT_BUTTON_SELECTED,
	},
	labelDisabled: {
		color: Colors.WHITE,
	},
})
