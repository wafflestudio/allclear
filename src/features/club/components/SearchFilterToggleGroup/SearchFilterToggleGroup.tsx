import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { SearchFilterToggleGroupItem } from './SearchFilterToggleGroupItem'
import type {
	SearchFilterToggleGroupAllItem,
	SearchFilterToggleGroupOption,
	SearchFilterToggleGroupSelection,
	SearchFilterToggleGroupSelectionMode,
} from './types'
import { useSearchFilterToggleGroup } from './useSearchFilterToggleGroup'

export type SearchFilterToggleGroupProps = {
	options: SearchFilterToggleGroupOption[]
	allItem?: SearchFilterToggleGroupAllItem
	selectionMode?: SearchFilterToggleGroupSelectionMode
	value: SearchFilterToggleGroupSelection
	onChange: (value: SearchFilterToggleGroupSelection) => void
	style?: StyleProp<ViewStyle>
	itemStyle?: StyleProp<ViewStyle>
}

export const SearchFilterToggleGroup = ({
	options,
	allItem,
	selectionMode,
	value,
	onChange,
	style,
	itemStyle,
}: SearchFilterToggleGroupProps) => {
	const { isAllSelected, isSelected, selectAll, toggle } = useSearchFilterToggleGroup({
		selectionMode,
		value,
		onChange,
	})

	return (
		<View style={[styles.container, style]}>
			{allItem ? (
				<SearchFilterToggleGroupItem
					key="$all"
					label={allItem.label}
					selected={isAllSelected}
					onPress={selectAll}
					style={itemStyle}
				/>
			) : null}
			{options.map(option => (
				<SearchFilterToggleGroupItem
					key={option.value}
					label={option.label}
					selected={isSelected(option.value)}
					onPress={() => toggle(option.value)}
					style={itemStyle}
				/>
			))}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
})
