import { memo, useRef, useState } from "react";
import {
	Pressable,
	type StyleProp,
	StyleSheet,
	type TextInput,
	type TextInputProps,
	type TextStyle,
	type ViewStyle,
} from "react-native";
import { AppTextInput } from "@/shared/components/AppText";
import { Colors } from "@/shared/constants/colors";
import { typography } from "@/shared/constants/typography";

const COLORS = {
	gray300: Colors.BODYTEXT_DISABLED,
	gray500: Colors.BODYTEXT_SUB,
} as const;

type TextFieldBorderStyle = {
	width?: number;
	color?: string;
};

type TextFieldValidation = {
	validate?: (value: string) => boolean;
	errorMessage?: string;
};

type Props = Omit<TextInputProps, "onChangeText"> & {
	width?: number;
	height?: number;
	border?: TextFieldBorderStyle;
	validation?: TextFieldValidation;
	onChangeText?: (value: string, isValid: boolean) => void;
};

const TextField = ({
	width,
	height = 48,
	border,
	validation,
	value = "",
	onChangeText,
	placeholderTextColor,
	style,
	onFocus,
	onBlur,
	...rest
}: Props) => {
	const [isFocused, setIsFocused] = useState(false);
	const inputRef = useRef<TextInput>(null);

	const isActive = isFocused || (value?.length ?? 0) > 0;
	const activeColor = isActive ? COLORS.gray500 : COLORS.gray300;

	const handleChangeText = (text: string) => {
		const isValid = validation?.validate ? validation.validate(text) : true;
		onChangeText?.(text, isValid);
	};

	const containerStyle: ViewStyle[] = [
		styles.container,
		{ height },
		{ borderWidth: border?.width ?? 1 },
		{ borderColor: border?.color ?? activeColor },
		width !== undefined ? { width } : { flex: 1 },
	];

	const inputStyle: StyleProp<TextStyle> = [
		styles.input,
		{ color: activeColor },
		style,
	];

	return (
		<Pressable
			accessible={false}
			style={containerStyle}
			onPress={() => inputRef.current?.focus()}
		>
			<AppTextInput
				ref={inputRef}
				style={inputStyle}
				value={value}
				onChangeText={handleChangeText}
				onFocus={(e) => {
					setIsFocused(true);
					onFocus?.(e);
				}}
				onBlur={(e) => {
					setIsFocused(false);
					onBlur?.(e);
				}}
				placeholderTextColor={placeholderTextColor ?? COLORS.gray300}
				{...rest}
			/>
		</Pressable>
	);
};

const styles = StyleSheet.create({
	container: {
		borderRadius: 8,
		justifyContent: "center",
	},
	input: {
		alignSelf: "stretch",
		fontFamily: typography.textInputMedium.fontFamily,
		fontSize: typography.textInputMedium.fontSize,
		includeFontPadding: false,
		paddingHorizontal: 20,
		paddingVertical: 0,
	},
});

export default memo(TextField);
