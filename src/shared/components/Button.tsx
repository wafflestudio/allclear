import React from 'react'
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native'
import { Colors } from '@/shared/constants/colors'

export type ButtonVariant = 'primary' | 'outline' | 'destructive'

export type ButtonProps = {
	label: string
	onPress: () => void
	variant?: ButtonVariant
	height?: number
	width?: number
	isSelected?: boolean
	disabled?: boolean
	style?: StyleProp<ViewStyle>
	textStyle?: StyleProp<TextStyle>
}

export const Button = ({
	label,
	onPress,
	variant = 'primary',
	height,
	isSelected = false,
	disabled = false,
	width,
	style,
	textStyle,
}: ButtonProps) => {
	const variantStyle = getVariantStyle(variant, isSelected, disabled)

	const containerStyle: ViewStyle[] = [
		styles.base,
		variantStyle.container,
		height !== undefined && { height },
		width !== undefined ? { width } : { flex: 1 },
		style,
	].filter((s): s is ViewStyle => !!s)

	const labelStyle: TextStyle[] = [styles.label, variantStyle.text, textStyle].filter(
		(s): s is TextStyle => !!s,
	)

	return (
		<Pressable
			style={({ pressed }) => [
				containerStyle,
				pressed &&
					(variant === 'primary'
						? { backgroundColor: Colors.BUTTON_PUSH }
						: variant === 'destructive'
							? { opacity: 0.8 }
							: { opacity: 0.7 }),
			]}
			onPress={onPress}
			disabled={disabled}>
			<Text style={labelStyle}>{label}</Text>
		</Pressable>
	)
}

const disabledVariantMap: Record<ButtonVariant, keyof typeof variantStyles> = {
	primary: 'primaryDisabled',
	outline: 'outlineDisabled',
	destructive: 'primaryDisabled',
}

const getVariantStyle = (
	variant: ButtonVariant,
	isSelected: boolean,
	disabled: boolean,
): { container: ViewStyle; text: TextStyle } => {
	if (isSelected) {
		return disabled ? variantStyles.primaryDisabled : variantStyles.primary
	}

	if (disabled) {
		return variantStyles[disabledVariantMap[variant]]
	}

	return variantStyles[variant]
}

const borderedContainer: ViewStyle = {
	backgroundColor: 'transparent',
	borderWidth: 1,
}

const variantStyles = {
	primary: {
		container: { backgroundColor: Colors.BUTTON_SELECTED } as ViewStyle,
		text: { color: Colors.TEXT_BUTTON_SELECTED } as TextStyle,
	},
	primaryDisabled: {
		container: { backgroundColor: Colors.TEXTBOX_SELECTED } as ViewStyle,
		text: { color: Colors.BODYTEXT_DISABLED } as TextStyle,
	},
	outline: {
		container: { ...borderedContainer, borderColor: Colors.BUTTON_SELECTED } as ViewStyle,
		text: { color: Colors.BUTTON_SELECTED } as TextStyle,
	},
	outlineDisabled: {
		container: { ...borderedContainer, borderColor: Colors.BODYTEXT_DISABLED } as ViewStyle,
		text: { color: Colors.BODYTEXT_DISABLED } as TextStyle,
	},
	destructive: {
		container: { backgroundColor: Colors.BUTTON_DESTRUCTIVE } as ViewStyle,
		text: { color: Colors.WHITE } as TextStyle,
	},
}

const styles = StyleSheet.create({
	base: {
		borderRadius: 8,
		paddingHorizontal: 50,
		paddingVertical: 14,
		justifyContent: 'center',
		alignItems: 'center',
	},
	label: {
		fontSize: 16,
		fontWeight: '600',
		lineHeight: 20,
	},
})

export default Button
