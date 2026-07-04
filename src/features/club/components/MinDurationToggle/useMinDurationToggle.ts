import { useCallback, useMemo, useState } from 'react'
import { LayoutChangeEvent } from 'react-native'
import { ms } from '@/shared/utils/scale'

export const THUMB_SIZE = ms(10)
export const MIN_DURATION_OPTIONS = [
	{ value: '0', label: '없음(0학기)' },
	{ value: '1', label: '1학기' },
	{ value: '2', label: '2학기' },
	{ value: '3_plus', label: '3학기 이상' },
] as const

export type MinDurationStepValue = (typeof MIN_DURATION_OPTIONS)[number]['value']
export type MinDurationValue = MinDurationStepValue[]

const MIN_DURATION_ORDER = MIN_DURATION_OPTIONS.map(option => option.value)
const MIN_DURATION_OPTION_COUNT = MIN_DURATION_OPTIONS.length

type LabelWidths = Partial<Record<MinDurationStepValue, number>>
type UseMinDurationToggleOptions = {
	value: MinDurationValue
	onChange: (value: MinDurationValue) => void
}

const getValidSelectedValues = (value: MinDurationValue) => {
	if (value.length === 0) {
		return []
	}

	return Array.from(
		new Set(
			value.filter(durationValue =>
				MIN_DURATION_ORDER.includes(durationValue as MinDurationStepValue),
			),
		),
	).sort(
		(left, right) =>
			MIN_DURATION_ORDER.indexOf(left as MinDurationStepValue) -
			MIN_DURATION_ORDER.indexOf(right as MinDurationStepValue),
	)
}

export const useMinDurationToggle = ({ value, onChange }: UseMinDurationToggleOptions) => {
	const selectedValues = getValidSelectedValues(value)

	const [labelsContainerWidth, setLabelsContainerWidth] = useState(0)
	const [labelWidths, setLabelWidths] = useState<LabelWidths>({})

	const handleToggleStep = useCallback(
		(durationValue: MinDurationStepValue) => {
			const nextSelectedValues = selectedValues.includes(durationValue)
				? selectedValues.filter(selectedValue => selectedValue !== durationValue)
				: [...selectedValues, durationValue].sort(
						(left, right) =>
							MIN_DURATION_ORDER.indexOf(left as MinDurationStepValue) -
							MIN_DURATION_ORDER.indexOf(right as MinDurationStepValue),
					)

			onChange(nextSelectedValues)
		},
		[onChange, selectedValues],
	)

	const handleLabelsContainerLayout = useCallback((event: LayoutChangeEvent) => {
		const { width } = event.nativeEvent.layout
		setLabelsContainerWidth(prev => (prev === width ? prev : width))
	}, [])

	const handleLabelLayout = useCallback((index: number, event: LayoutChangeEvent) => {
		const { width } = event.nativeEvent.layout
		const option = MIN_DURATION_OPTIONS[index]

		if (option === undefined) {
			return
		}

		setLabelWidths(prev => {
			if (prev[option.value] === width) {
				return prev
			}

			return {
				...prev,
				[option.value]: width,
			}
		})
	}, [])

	const firstLabelWidth = labelWidths[MIN_DURATION_OPTIONS[0].value] ?? 0
	const lastLabelWidth = labelWidths[MIN_DURATION_OPTIONS[MIN_DURATION_OPTION_COUNT - 1].value] ?? 0
	const trackStart = firstLabelWidth / 2
	const trackEnd = Math.max(labelsContainerWidth - lastLabelWidth / 2, trackStart)
	const trackWidth = Math.max(trackEnd - trackStart, 0)
	const stepCenters = useMemo(
		() =>
			MIN_DURATION_OPTIONS.map(
				(_, index) => trackStart + (trackWidth * index) / (MIN_DURATION_OPTION_COUNT - 1),
			),
		[trackStart, trackWidth],
	)

	return {
		labelWidths,
		labelsContainerWidth,
		stepCenters,
		selectedValues,
		handleToggleStep,
		handleLabelsContainerLayout,
		handleLabelLayout,
		trackStart,
		trackWidth,
	}
}
