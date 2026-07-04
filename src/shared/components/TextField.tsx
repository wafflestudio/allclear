import { useState } from 'react'
import { TextInput, TextInputProps, StyleSheet, TextStyle, ViewStyle } from 'react-native'
import { Colors } from '@/shared/constants/colors'

const COLORS = {
	gray300: Colors.BODYTEXT_DISABLED,
	gray500: Colors.BODYTEXT_SUB,
} as const

type TextFieldBorderStyle = {
	width?: number
	color?: string
}

type TextFieldValidation = {
	validate?: (value: string) => boolean
	errorMessage?: string
}

type Props = Omit<TextInputProps, 'onChangeText'> & {
	width?: number
	height?: number
	border?: TextFieldBorderStyle
	validation?: TextFieldValidation
	onChangeText?: (value: string, isValid: boolean) => void
}

const TextField = ({
	width,
	height = 48,
	border,
	validation,
	value = '',
	onChangeText,
	placeholderTextColor,
	style,
	onFocus,
	onBlur,
	...rest
}: Props) => {
	const [isFocused, setIsFocused] = useState(false)

	const isActive = isFocused || (value?.length ?? 0) > 0
	const activeColor = isActive ? COLORS.gray500 : COLORS.gray300

	const handleChangeText = (text: string) => {
		const isValid = validation?.validate ? validation.validate(text) : true
		onChangeText?.(text, isValid)
	}

	const containerStyle: ViewStyle[] = [
		styles.base,
		{ height },
		{ borderWidth: border?.width ?? 1 },
		{ borderColor: border?.color ?? activeColor },
		width !== undefined ? { width } : { flex: 1 },
	]

	const inputStyle: TextStyle[] = [styles.text, { color: activeColor }]

	return (
		<TextInput
			style={[containerStyle, inputStyle, style]}
			value={value}
			onChangeText={handleChangeText}
			onFocus={e => {
				setIsFocused(true)
				onFocus?.(e)
			}}
			onBlur={e => {
				setIsFocused(false)
				onBlur?.(e)
			}}
			placeholderTextColor={placeholderTextColor ?? COLORS.gray300}
			{...rest}
		/>
	)
}

const styles = StyleSheet.create({
	base: {
		borderRadius: 8,
		paddingVertical: 15,
		paddingHorizontal: 20,
	},
	text: {
		fontSize: 16,
		fontWeight: '500',
	},
})

export default TextField
