import { useCallback } from 'react'
import type {
	SearchFilterToggleGroupSelection,
	SearchFilterToggleGroupSelectionMode,
} from './types'

export type UseSearchFilterToggleGroupParams = {
	selectionMode?: SearchFilterToggleGroupSelectionMode
	value: SearchFilterToggleGroupSelection
	onChange: (value: SearchFilterToggleGroupSelection) => void
}

export type UseSearchFilterToggleGroupReturn = {
	selection: SearchFilterToggleGroupSelection
	isAllSelected: boolean
	isSelected: (value: string) => boolean
	toggle: (value: string) => void
	selectAll: () => void
	reset: () => void
}

const NONE_SELECTION: SearchFilterToggleGroupSelection = { kind: 'none' }
const ALL_SELECTION: SearchFilterToggleGroupSelection = { kind: 'all' }

const sanitizeExternalSelection = ({
	selection,
	selectionMode,
}: {
	selection: SearchFilterToggleGroupSelection
	selectionMode: SearchFilterToggleGroupSelectionMode
}): SearchFilterToggleGroupSelection => {
	if (selection.kind !== 'values') {
		return selection
	}

	const uniqueValues = [...new Set(selection.values)]

	if (uniqueValues.length === 0) {
		return NONE_SELECTION
	}

	if (selectionMode === 'single') {
		return {
			kind: 'values',
			values: uniqueValues.slice(0, 1),
		}
	}

	return {
		kind: 'values',
		values: uniqueValues,
	}
}

const getNextSelection = ({
	selection,
	value,
	selectionMode,
}: {
	selection: SearchFilterToggleGroupSelection
	value: string
	selectionMode: SearchFilterToggleGroupSelectionMode
}): SearchFilterToggleGroupSelection => {
	if (selection.kind !== 'values') {
		return { kind: 'values', values: [value] }
	}

	const isCurrentlySelected = selection.values.includes(value)

	if (selectionMode === 'single') {
		if (isCurrentlySelected) {
			return NONE_SELECTION
		}

		return { kind: 'values', values: [value] }
	}

	if (isCurrentlySelected) {
		const nextValues = selection.values.filter(selectedValue => selectedValue !== value)

		if (nextValues.length === 0) {
			return NONE_SELECTION
		}

		return { kind: 'values', values: nextValues }
	}

	return {
		kind: 'values',
		values: [...selection.values, value],
	}
}

export const useSearchFilterToggleGroup = ({
	selectionMode = 'multiple',
	value,
	onChange,
}: UseSearchFilterToggleGroupParams): UseSearchFilterToggleGroupReturn => {
	const selection = sanitizeExternalSelection({
		selection: value,
		selectionMode,
	})

	const updateSelection = useCallback(
		(nextSelection: SearchFilterToggleGroupSelection) => {
			onChange(nextSelection)
		},
		[onChange],
	)

	const isSelected = (optionValue: string) =>
		selection.kind === 'values' && selection.values.includes(optionValue)

	const toggle = useCallback(
		(nextSelectedValue: string) => {
			const nextSelection = getNextSelection({
				selection,
				value: nextSelectedValue,
				selectionMode,
			})

			updateSelection(nextSelection)
		},
		[selection, selectionMode, updateSelection],
	)

	const selectAll = () => {
		updateSelection(ALL_SELECTION)
	}

	const reset = () => {
		updateSelection(NONE_SELECTION)
	}

	return {
		selection,
		isAllSelected: selection.kind === 'all',
		isSelected,
		toggle,
		selectAll,
		reset,
	}
}
