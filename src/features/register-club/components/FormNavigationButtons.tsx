import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors } from '@/shared/constants/colors'
import { typography } from '@/shared/constants/typography'
import { s, vs } from '@/shared/utils/scale'

type Props = {
	onPrevious?: () => void
	onNext?: () => void
	nextLabel?: string
	previousLabel?: string
	isLastStep?: boolean
	isNextDisabled?: boolean
	/** Step completion ratio (0–1) used to fill the progress bar. */
	progress?: number
}

export const FormNavigationButtons = ({
	onPrevious,
	onNext,
	nextLabel = '다음',
	previousLabel = '이전',
	isLastStep = false,
	isNextDisabled = false,
	progress = 0,
}: Props) => {
	const insets = useSafeAreaInsets()
	const clampedProgress = Math.max(0, Math.min(1, progress))

	return (
		<View style={[styles.footer, { paddingBottom: insets.bottom }]}>
			<View style={styles.progressTrack}>
				<View style={[styles.progressFill, { width: `${clampedProgress * 100}%` }]} />
			</View>

			<View style={[styles.row, !onPrevious && styles.rowNoPrevious]}>
				{onPrevious && (
					<Pressable onPress={onPrevious} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
						<Text style={styles.previousText}>{previousLabel}</Text>
					</Pressable>
				)}

				<Pressable
					style={({ pressed }) => [
						styles.nextButton,
						isNextDisabled && styles.nextButtonDisabled,
						pressed && !isNextDisabled && styles.nextButtonPressed,
					]}
					onPress={onNext}
					disabled={isNextDisabled}>
					<Text style={styles.nextButtonText}>{isLastStep ? '완료' : nextLabel}</Text>
				</Pressable>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	footer: {
		backgroundColor: Colors.TEXTBOX_SELECTED,
	},
	progressTrack: {
		height: vs(4),
		backgroundColor: Colors.TEXTBOX_SELECTED,
	},
	progressFill: {
		height: vs(4),
		backgroundColor: Colors.BODYTEXT_SUB,
		borderTopRightRadius: 10,
		borderBottomRightRadius: 10,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: s(20),
		paddingVertical: vs(14),
	},
	rowNoPrevious: {
		justifyContent: 'flex-end',
	},
	previousText: {
		...typography.bodyMRegular,
		color: Colors.BODYTEXT_SUB,
	},
	nextButton: {
		minWidth: s(110),
		paddingHorizontal: s(40),
		paddingVertical: vs(12),
		borderRadius: 8,
		backgroundColor: Colors.BUTTON_SELECTED,
		alignItems: 'center',
		justifyContent: 'center',
	},
	nextButtonDisabled: {
		backgroundColor: Colors.BUTTON_UNSELECTED,
	},
	nextButtonPressed: {
		backgroundColor: Colors.BUTTON_PUSH,
	},
	nextButtonText: {
		...typography.headerL,
		color: Colors.TEXT_BUTTON_SELECTED,
	},
})
