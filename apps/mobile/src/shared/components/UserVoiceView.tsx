import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import React, { useContext } from "react";
import {
	Keyboard,
	StyleSheet,
	Text,
	TouchableOpacity,
	TouchableWithoutFeedback,
	View,
} from "react-native";
import Toast from "react-native-toast-message";
import { Colors } from "@/shared/constants/colors";
import { typography } from "@/shared/constants/typography";
import { serviceContext } from "@/shared/contexts/serviceContext";
import { ms, s, vs } from "@/shared/utils/scale";

type Props = {
	closeBottomSheet: () => void;
};

const UserVoiceView = ({ closeBottomSheet }: Props) => {
	const [input, setInput] = React.useState("");
	const { userService } = useContext(serviceContext);

	const handleSubmit = async () => {
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
		<TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}>
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
				<View>
					<View style={styles.inputWrapper}>
						<BottomSheetTextInput
							value={input}
							onChangeText={setInput}
							multiline
							numberOfLines={4}
							maxLength={1000}
							returnKeyType="done"
							submitBehavior="blurAndSubmit"
							style={styles.input}
							placeholder="여기에 의견을 적어주세요. (1000자 이내)"
							placeholderTextColor={Colors.BODYTEXT_SUB}
						/>
					</View>
				</View>
				<View style={styles.buttonWrapper}>
					<TouchableOpacity
						disabled={!input}
						onPress={handleSubmit}
						style={styles.button}
					>
						<Text style={styles.buttonText}>의견 보내기</Text>
					</TouchableOpacity>
				</View>
			</View>
		</TouchableWithoutFeedback>
	);
};

export default UserVoiceView;

const styles = StyleSheet.create({
	mainWrapper: {
		flex: 1,
		paddingTop: vs(24),
		paddingBottom: vs(16),
		paddingHorizontal: s(24),
		backgroundColor: Colors.WHITE,
	},

	titleWrapper: {
		display: "flex",
		flex: 0,
		justifyContent: "center",
		alignItems: "center",
		marginBottom: vs(24),
	},

	title: {
		...typography.textInputMedium,
		color: Colors.BODYTEXT_MAIN,
	},

	bold: {
		...typography.headerL,
	},

	inputWrapper: {},

	input: {
		height: vs(120),
		backgroundColor: Colors.WHITE,
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
	buttonText: {
		...typography.headerL,
		color: Colors.WHITE,
		textAlign: "center",
	},
});
