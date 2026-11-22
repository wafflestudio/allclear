import type { ReactNode } from "react";
import {
	Image,
	type ImageStyle,
	Pressable,
	type StyleProp,
	StyleSheet,
	View,
	type ViewStyle,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Colors } from "@/shared/constants/colors";
import { s } from "@/shared/utils/scale";

type Props = {
	imageUri?: string | null;
	onPress?: () => void;
	accessibilityLabel?: string;
	style: StyleProp<ViewStyle>;
	imageStyle?: StyleProp<ImageStyle>;
	children?: ReactNode;
};

const ImagePickerTile = ({
	imageUri,
	onPress,
	accessibilityLabel,
	style,
	imageStyle,
	children,
}: Props) => {
	const content = imageUri ? (
		<Image
			source={{ uri: imageUri }}
			resizeMode="cover"
			style={[styles.image, imageStyle]}
		/>
	) : (
		(children ?? (
			<Icon name="add" size={s(40)} color={Colors.BODYTEXT_DISABLED} />
		))
	);

	if (!onPress) {
		return <View style={style}>{content}</View>;
	}

	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={accessibilityLabel}
			style={style}
			onPress={onPress}
		>
			{content}
		</Pressable>
	);
};

export default ImagePickerTile;

const styles = StyleSheet.create({
	image: {
		width: "100%",
		height: "100%",
	},
});
