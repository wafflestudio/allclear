import { Text, TextInput } from "react-native";

type TextComponentWithDefaults = {
	defaultProps?: {
		allowFontScaling?: boolean;
	};
};

const disableFontScaling = (component: TextComponentWithDefaults) => {
	component.defaultProps = {
		...component.defaultProps,
		allowFontScaling: false,
	};
};

export const configureTextFontScaling = () => {
	disableFontScaling(Text as TextComponentWithDefaults);
	disableFontScaling(TextInput as TextComponentWithDefaults);
};
