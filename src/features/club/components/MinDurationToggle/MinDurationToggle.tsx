import React from 'react'
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import { Colors } from '@/shared/constants/colors'
import { typography } from '@/shared/constants/typography'
import { vs } from '@/shared/utils/scale'
import { MinDurationToggleItem } from './MinDurationToggleItem'
import {
	MIN_DURATION_OPTIONS,
	THUMB_SIZE,
	useMinDurationToggle,
	type MinDurationValue,
} from './useMinDurationToggle'

export type MinDurationToggleProps = {
	style?: StyleProp<ViewStyle>
	value: MinDurationValue
	onChange: (value: MinDurationValue) => void
}

const TRACK_HEIGHT = vs(4)

const MinDurationToggleHeader = () => (
	<View style={styles.header}>
		<Text style={styles.title}>최소활동기간</Text>
	</View>
)

export const MinDurationToggle = ({ style, value, onChange }: MinDurationToggleProps) => {
	const {
		labelWidths,
		stepCenters,
		selectedValues,
		handleToggleStep,
		handleLabelsContainerLayout,
		handleLabelLayout,
		trackStart,
		trackWidth,
	} = useMinDurationToggle({ value, onChange })

	const selectedValueSet = new Set(selectedValues)

	return (
		<View style={[styles.container, style]}>
			<MinDurationToggleHeader />

			<View style={styles.toggleArea}>
				<View style={styles.trackArea}>
					<View
						style={[
							styles.track,
							{
								left: trackStart,
								width: trackWidth,
							},
						]}
					/>

					{MIN_DURATION_OPTIONS.slice(0, -1).map((option, index) => {
						const nextOption = MIN_DURATION_OPTIONS[index + 1]
						const startCenterX = stepCenters[index]
						const endCenterX = stepCenters[index + 1]

						if (
							nextOption === undefined ||
							!selectedValueSet.has(option.value) ||
							!selectedValueSet.has(nextOption.value) ||
							startCenterX === undefined ||
							endCenterX === undefined
						) {
							return null
						}

						return (
							<View
								key={`${option.value}-${nextOption.value}`}
								style={[
									styles.connectedTrack,
									{
										left: startCenterX,
										width: endCenterX - startCenterX,
									},
								]}
							/>
						)
					})}

					{stepCenters.map((centerX, index) => {
						const option = MIN_DURATION_OPTIONS[index]

						if (option === undefined) {
							return null
						}

						return (
							<MinDurationToggleItem
								key={option.value}
								centerX={centerX}
								onPress={() => handleToggleStep(option.value)}
								selected={selectedValueSet.has(option.value)}
							/>
						)
					})}
				</View>

				<View onLayout={handleLabelsContainerLayout} style={styles.labelsRow}>
					{MIN_DURATION_OPTIONS.map((option, index) => (
						<View
							key={option.value}
							onLayout={event => handleLabelLayout(index, event)}
							style={[
								styles.labelSlot,
								index === 0
									? styles.firstLabelSlot
									: index === MIN_DURATION_OPTIONS.length - 1
										? styles.lastLabelSlot
										: {
												left: (stepCenters[index] ?? 0) - (labelWidths[option.value] ?? 0) / 2,
											},
							]}>
							<Text style={styles.labelText}>{option.label}</Text>
						</View>
					))}
				</View>

				<Text style={styles.description}>원하는 기간을 모두 선택해보세요.</Text>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		gap: vs(12),
	},
	header: {
		alignItems: 'flex-start',
	},
	toggleArea: {
		gap: vs(8),
		width: '100%',
	},
	trackArea: {
		height: THUMB_SIZE,
		justifyContent: 'center',
		position: 'relative',
		width: '100%',
	},
	track: {
		backgroundColor: Colors.GRAY,
		borderRadius: TRACK_HEIGHT / 2,
		height: TRACK_HEIGHT,
		position: 'absolute',
		top: (THUMB_SIZE - TRACK_HEIGHT) / 2,
	},
	connectedTrack: {
		backgroundColor: Colors.POINTCOLOR,
		borderRadius: TRACK_HEIGHT / 2,
		height: TRACK_HEIGHT,
		position: 'absolute',
		top: (THUMB_SIZE - TRACK_HEIGHT) / 2,
	},
	labelsRow: {
		position: 'relative',
		width: '100%',
		height: vs(18),
	},
	labelSlot: {
		alignItems: 'center',
		position: 'absolute',
		top: 0,
	},
	firstLabelSlot: {
		left: 0,
	},
	lastLabelSlot: {
		right: 0,
	},
	labelText: {
		...typography.bodySRegular,
		color: Colors.BODYTEXT_SUB,
		textAlign: 'center',
	},
	title: {
		...typography.bodySMedium,
		color: Colors.BODYTEXT_SUB,
		height: vs(18),
	},
	description: {
		...typography.bodySRegular,
		color: Colors.BODYTEXT_SUB,
		textAlign: 'center',
	},
})
