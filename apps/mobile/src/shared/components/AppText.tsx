import { forwardRef } from "react";
import {
	Text as NativeText,
	TextInput as NativeTextInput,
	type TextInputProps,
	type TextProps,
} from "react-native";

export const AppText = forwardRef<NativeText, TextProps>((props, ref) => (
	<NativeText ref={ref} {...props} allowFontScaling={false} />
));

AppText.displayName = "AppText";

export const AppTextInput = forwardRef<NativeTextInput, TextInputProps>(
	(props, ref) => (
		<NativeTextInput ref={ref} {...props} allowFontScaling={false} />
	),
);

AppTextInput.displayName = "AppTextInput";
