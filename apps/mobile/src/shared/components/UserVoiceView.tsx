import { BottomSheetTextInput, TouchableOpacity } from "@gorhom/bottom-sheet";
import React, { useContext } from "react";
import { Keyboard, StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import { Colors } from "@/shared/constants/colors";
import { typography } from "@/shared/constants/typography";
import { serviceContext } from "@/shared/contexts/serviceContext";
import { ms, s, vs } from "@/shared/utils/scale";

type Props = {
	closeBottomSheet: () => void;
	value?: string;
	onChangeText?: (value: string) => void;
	hideSubmitButton?: boolean;
};

type SubmitButtonProps = {
	disabled: boolean;
	onPress: () => void;
};

export const UserVoiceSubmitButton = ({
	disabled,
	onPress,
}: SubmitButtonProps) => (
	<TouchableOpacity
		disabled={disabled}
		accessibilityState={{ disabled }}
		onPress={onPress}
		style={[styles.button, disabled && styles.buttonDisabled]}
	>
		<Text style={styles.buttonText}>의견 보내기</Text>
	</TouchableOpacity>
);

const UserVoiceView = ({
	closeBottomSheet,
	value,
	onChangeText,
	hideSubmitButton = false,
}: Props) => {
	const [localInput, setLocalInput] = React.useState("");
	const [inputMaxHeight, setInputMaxHeight] = React.useState<number>();
	const { userService } = useContext(serviceContext);
	const input = value ?? localInput;
	const setInput = onChangeText ?? setLocalInput;
	const canSubmit = input.trim().length > 0;

	const handleSubmit = async () => {
		if (!canSubmit) return;

		try {
			Keyboard.dismiss();
			closeBottomSheet();
			await userService.createUserVoice({ content: input });

			setTimeout(() => {
				Toast.show({
					type: "info",
					text1: "의견이 전송되었어요!",
					position: "bottom",
					visibilityTime: 2000,
				});
			}, 1000);

			setInput("");
		} catch {
			Toast.show({
				type: "info",
				text1: `이런! 문제가 생겼어요!`,
				position: "bottom",
				visibilityTime: 2000,
			});
		}
	};

	return (
		<View style={styles.mainWrapper}>
			<View style={styles.titleWrapper}>
				<View>
					<Text style={[styles.title, styles.bold]}>
						여러분의 의견이 필요해요!
					</Text>
					<Text style={styles.title}>
						올클에 건의사항이 있다면 자유롭게 알려주세요😊
					</Text>
				</View>
			</View>
			<View
				style={styles.inputWrapper}
				onLayout={({ nativeEvent }) => {
					if (!input) {
						setInputMaxHeight(nativeEvent.layout.height);
					}
				}}
			>
				<BottomSheetTextInput
					value={input}
					onChangeText={setInput}
					multiline
					scrollEnabled
					numberOfLines={4}
					maxLength={1000}
					returnKeyType="default"
					submitBehavior="newline"
					style={[styles.input, { maxHeight: inputMaxHeight }]}
					placeholder="여기에 의견을 적어주세요. (1000자 이내)"
					placeholderTextColor={Colors.BODYTEXT_SUB}
				/>
				{!hideSubmitButton && (
					<UserVoiceSubmitButton disabled={!canSubmit} onPress={handleSubmit} />
				)}
			</View>
		</View>
	);
};

export default UserVoiceView;

const styles = StyleSheet.create({
	mainWrapper: {
		minHeight: 0,
		display: "flex",
		flexDirection: "column",
		padding: vs(24),
		gap: vs(16),
		flex: 1,
	},

	titleWrapper: {
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
	},

	title: {
		...typography.textInputMedium,
		color: Colors.BODYTEXT_MAIN,
	},

	bold: {
		...typography.headerL,
	},

	inputWrapper: {
		flex: 1,
		minHeight: 0,
		display: "flex",
		flexDirection: "column",
		gap: vs(16),
	},

	input: {
		flex: 1,
		minHeight: 0,
		paddingHorizontal: s(16),
		paddingVertical: vs(8),
		borderRadius: ms(12),
		...typography.textInputMedium,
		color: Colors.BODYTEXT_MAIN,
		textAlignVertical: "top",
	},

	buttonWrapper: {
		marginTop: "auto",
		width: "100%",
	},

	button: {
		backgroundColor: Colors.BODYTEXT_MAIN,
		padding: s(16),
		borderRadius: ms(12),
	},
	buttonDisabled: {
		backgroundColor: Colors.BUTTON_UNSELECTED,
	},
	buttonText: {
		...typography.headerL,
		color: Colors.WHITE,
		textAlign: "center",
	},
});
