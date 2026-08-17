import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import AlertModal from "@/shared/components/AlertModal";
import { Colors } from "@/shared/constants/colors";
import { SCREEN_TYPE } from "@/shared/constants/screen";
import { typography } from "@/shared/constants/typography";
import { navigation } from "@/shared/utils/navigation";

type Props = {
	closeBottomSheet: () => void;
};

const ManageClubView = ({ closeBottomSheet }: Props) => {
	const [selectedOption, setSelectedOption] = useState<string>("");
	const [isCampusOnlyModalVisible, setIsCampusOnlyModalVisible] =
		useState(false);

	const options = [
		{ id: "campus", label: "교내 동아리" },
		{ id: "external", label: "교외 동아리" },
		{ id: "existing", label: "이미 있는 동아리 운영진 등록" },
	];

	const isSelectionValid = selectedOption.length > 0;

	const handleSelectionNext = () => {
		if (!isSelectionValid) return;
		if (selectedOption === "existing") {
			// close bottom sheet first, then navigate to full-screen flow
			closeBottomSheet();
			setTimeout(() => {
				navigation.navigate(SCREEN_TYPE.MANAGE_CLUB_REGISTRATION);
			}, 300);
			return;
		}

		if (selectedOption === "external") {
			setIsCampusOnlyModalVisible(true);
			return;
		}

		// 교내: close bottom sheet first, then launch the full-screen registration wizard
		closeBottomSheet();
		setTimeout(() => {
			navigation.navigate("등록");
		}, 300);
	};

	const handleCampusOnlyConfirm = () => {
		setIsCampusOnlyModalVisible(false);
		closeBottomSheet();
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>등록할 동아리의 유형을 선택해주세요</Text>

			{options.map((option) => (
				<TouchableOpacity
					key={option.id}
					style={[
						styles.optionButton,
						selectedOption === option.id
							? styles.optionButtonSelected
							: styles.optionButtonUnselected,
					]}
					onPress={() => setSelectedOption(option.id)}
				>
					<Text
						style={[
							styles.optionButtonText,
							selectedOption === option.id
								? styles.optionButtonTextSelected
								: styles.optionButtonTextUnselected,
						]}
					>
						{option.label}
					</Text>
				</TouchableOpacity>
			))}

			<TouchableOpacity
				style={[styles.button, !isSelectionValid && styles.buttonDisabled]}
				onPress={handleSelectionNext}
				disabled={!isSelectionValid}
			>
				<Text
					style={[
						styles.buttonText,
						!isSelectionValid && styles.buttonTextDisabled,
					]}
				>
					다음
				</Text>
			</TouchableOpacity>

			<AlertModal
				visible={isCampusOnlyModalVisible}
				onClose={() => setIsCampusOnlyModalVisible(false)}
				title={"현재 올클 서비스는 교내 동아리\n대상으로만 제공되고 있어요"}
				description="확장 운영을 위해서 더 노력하는 올클이 될게요"
				buttonLabel="확인"
				onButtonPress={handleCampusOnlyConfirm}
				dismissOnBackdropPress={false}
			/>
		</View>
	);
};

export default ManageClubView;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 20,
		paddingTop: 30,
		paddingBottom: 50,
		borderTopLeftRadius: 12,
		borderTopRightRadius: 12,
		backgroundColor: Colors.WHITE,
	},
	title: {
		...typography.headerXLSemibold,
		fontSize: 18,
		lineHeight: 24,
		color: Colors.BODYTEXT_MAIN,
		padding: 10,
		marginBottom: 10,
	},
	optionButton: {
		height: 56,
		paddingHorizontal: 20,
		borderRadius: 8,
		alignItems: "flex-start",
		justifyContent: "center",
		marginBottom: 10,
	},
	optionButtonUnselected: {
		borderWidth: 1,
		borderColor: Colors.BODYTEXT_DISABLED,
		backgroundColor: Colors.WHITE,
	},
	optionButtonSelected: {
		backgroundColor: Colors.TEXTBOX_SELECTED,
		borderWidth: 0,
	},
	optionButtonText: {
		...typography.bodyMMedium,
		fontSize: 16,
		lineHeight: 24,
		textAlign: "left",
		width: "100%",
	},
	optionButtonTextUnselected: {
		color: Colors.BODYTEXT_DISABLED,
	},
	optionButtonTextSelected: {
		color: Colors.BODYTEXT_SUB,
	},
	button: {
		height: 44,
		paddingHorizontal: 50,
		paddingVertical: 12,
		borderRadius: 8,
		backgroundColor: Colors.BUTTON_SELECTED,
		alignItems: "center",
		justifyContent: "center",
		width: "100%",
	},
	buttonDisabled: {
		backgroundColor: Colors.TEXTBOX_UNSELECTED,
	},
	buttonText: {
		...typography.headerL,
		lineHeight: 20,
		color: Colors.TEXT_BUTTON_SELECTED,
	},
	buttonTextDisabled: {
		color: Colors.TEXT_BUTTON_UNSELECTED,
	},
});
