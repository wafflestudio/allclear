export type SearchFilterToggleGroupOption = {
	label: string
	value: string
}

export type SearchFilterToggleGroupAllItem = {
	label: string
}

export type SearchFilterToggleGroupSelectionMode = 'single' | 'multiple'

export type SearchFilterToggleGroupSelection =
	| { kind: 'all' }
	| { kind: 'none' }
	| { kind: 'values'; values: string[] }
