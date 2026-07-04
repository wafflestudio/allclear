import { useEffect } from 'react'
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native'
import Animated, {
	interpolateColor,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated'

import { Colors } from '@/shared/constants/colors'
import { typography } from '@/shared/constants/typography'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

const SELECTED_BACKGROUND_COLOR = Colors.BUTTON_SELECTED
const UNSELECTED_BACKGROUND_COLOR = 'rgba(255, 255, 255, 0)'

export type SearchFilterToggleGroupItemProps = {
	label: string
	selected: boolean
	onPress: () => void
	style?: StyleProp<ViewStyle>
}

export const SearchFilterToggleGroupItem = ({
	label,
	selected,
	onPress,
	style,
}: SearchFilterToggleGroupItemProps) => {
	const progress = useSharedValue(selected ? 1 : 0)

	useEffect(() => {
		progress.value = withTiming(selected ? 1 : 0, { duration: 160 })
	}, [progress, selected])

	const animatedStyle = useAnimatedStyle(() => ({
		backgroundColor: interpolateColor(
			progress.value,
			[0, 1],
			[UNSELECTED_BACKGROUND_COLOR, SELECTED_BACKGROUND_COLOR],
		),
	}))

	return (
		<AnimatedPressable
			onPress={onPress}
			hitSlop={8}
			style={[
				styles.container,
				selected ? styles.selected : styles.unselected,
				animatedStyle,
				style,
			]}>
			<Text style={[styles.text, selected ? styles.textSelected : styles.textUnselected]}>
				{label}
			</Text>
		</AnimatedPressable>
	)
}

const styles = StyleSheet.create({
	container: {
		borderRadius: 20,
		paddingTop: 7,
		paddingBottom: 8,
		paddingHorizontal: 15,
	},
	selected: {
		borderWidth: 1,
		borderColor: 'transparent',
	},
	unselected: {
		borderWidth: 1,
		borderColor: Colors.BUTTON_UNSELECTED,
	},
	text: {
		...typography.bodySSmallMedium,
	},
	textSelected: {
		color: Colors.TEXT_BUTTON_SELECTED,
		...typography.bodySSmallSemibold,
	},
	textUnselected: {
		color: Colors.TEXT_BUTTON_UNSELECTED,
	},
})
