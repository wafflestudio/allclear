import React, { ReactNode } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Colors } from '@/shared/constants/colors'

type Props = {
	backLabel: string
	nextLabel?: string
	onBack: () => void
	onNext?: () => void
	nextDisabled?: boolean
	rightSlot?: ReactNode
}

const FlowScreenFooter = ({
	backLabel,
	nextLabel,
	onBack,
	onNext,
	nextDisabled = false,
	rightSlot,
}: Props) => {
	return (
		<View style={styles.footer}>
			<TouchableOpacity style={styles.backButton} onPress={onBack} hitSlop={8}>
				<Text style={styles.backButtonText}>{backLabel}</Text>
			</TouchableOpacity>
			{rightSlot ?? (nextLabel && onNext ? (
				<TouchableOpacity
					style={[styles.nextButton, nextDisabled && styles.nextButtonDisabled]}
					onPress={onNext}
					disabled={nextDisabled}>
					<Text style={[styles.nextButtonText, nextDisabled && styles.nextButtonTextDisabled]}>{nextLabel}</Text>
				</TouchableOpacity>
			) : (
				<View style={styles.nextButtonSpacer} />
			))}
		</View>
	)
}

export default FlowScreenFooter

const styles = StyleSheet.create({
	footer: {
		height: 93,
		backgroundColor: '#EAEAEA',
		paddingHorizontal: 20,
		paddingTop: 16,
		paddingBottom: 39,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	backButton: {
		paddingVertical: 10,
		paddingRight: 16,
	},
	backButtonText: {
		fontSize: 14,
		fontWeight: '400',
		color: '#757474',
	},
	nextButton: {
		width: 128,
		height: 44,
		borderRadius: 8,
		backgroundColor: Colors.BUTTON_SELECTED,
		alignItems: 'center',
		justifyContent: 'center',
	},
	nextButtonDisabled: {
		backgroundColor: Colors.TEXTBOX_UNSELECTED,
	},
	nextButtonText: {
		fontSize: 16,
		fontWeight: '600',
		color: Colors.WHITE,
	},
	nextButtonTextDisabled: {
		color: Colors.TEXT_BUTTON_UNSELECTED,
	},
	nextButtonSpacer: {
		width: 128,
		height: 44,
	},
})