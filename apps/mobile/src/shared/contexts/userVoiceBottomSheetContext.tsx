import {
	BottomSheetBackdrop,
	type BottomSheetBackdropProps,
	BottomSheetFooter,
	type BottomSheetFooterProps,
	BottomSheetModal,
	BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import type React from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import {
	BackHandler,
	Keyboard,
	Platform,
	StyleSheet,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import {
	UserVoiceSubmitButton,
	default as UserVoiceView,
} from "@/shared/components/UserVoiceView";
import { serviceContext } from "@/shared/contexts/serviceContext";
import { s } from "@/shared/utils/scale";

const UserVoiceBottomSheetContext = createContext<{
	openBottomSheet: () => void;
	closeBottomSheet: () => void;
}>({
	openBottomSheet: () => {},
	closeBottomSheet: () => {},
});

export const useUserVoiceBottomSheet = () =>
	useContext(UserVoiceBottomSheetContext);

type Props = {
	children: React.ReactNode;
};

export const UserVoiceBottomSheetProvider = ({ children }: Props) => {
	const bottomSheetModalRef = useRef<BottomSheetModal>(null);
	const isBottomSheetOpenRef = useRef(false);
	const [input, setInput] = useState("");
	const { bottom: bottomSafeArea } = useSafeAreaInsets();
	const { userService } = useContext(serviceContext);
	const canSubmit = input.trim().length > 0;

	const renderBackdrop = useCallback(
		(props: BottomSheetBackdropProps) => (
			<BottomSheetBackdrop
				{...props}
				pressBehavior={"close"}
				appearsOnIndex={0}
				disappearsOnIndex={-1}
			/>
		),
		[],
	);

	const openBottomSheet = useCallback(() => {
		isBottomSheetOpenRef.current = true;
		bottomSheetModalRef.current?.present();
	}, []);

	const closeBottomSheet = useCallback(() => {
		isBottomSheetOpenRef.current = false;
		bottomSheetModalRef.current?.close();
	}, []);

	const handleSubmit = useCallback(async () => {
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
				text1: "이런! 문제가 생겼어요!",
				position: "bottom",
				visibilityTime: 2000,
			});
		}
	}, [canSubmit, closeBottomSheet, input, userService]);

	const renderFooter = useCallback(
		(props: BottomSheetFooterProps) => (
			<BottomSheetFooter {...props} bottomInset={0}>
				<View style={[styles.footer, { paddingBottom: bottomSafeArea }]}>
					<UserVoiceSubmitButton disabled={!canSubmit} onPress={handleSubmit} />
				</View>
			</BottomSheetFooter>
		),
		[bottomSafeArea, canSubmit, handleSubmit],
	);

	useEffect(() => {
		const subscription = BackHandler.addEventListener(
			"hardwareBackPress",
			() => {
				if (!isBottomSheetOpenRef.current) {
					return false;
				}

				closeBottomSheet();
				return true;
			},
		);

		return () => subscription.remove();
	}, [closeBottomSheet]);

	return (
		<UserVoiceBottomSheetContext.Provider
			value={{
				openBottomSheet,
				closeBottomSheet,
			}}
		>
			{children}
			<BottomSheetModal
				ref={bottomSheetModalRef}
				index={0}
				snapPoints={[Platform.OS === "ios" ? 440 : 420]}
				bottomInset={0}
				enableDynamicSizing={false}
				enablePanDownToClose
				enableBlurKeyboardOnGesture
				keyboardBlurBehavior="restore"
				onDismiss={() => {
					isBottomSheetOpenRef.current = false;
				}}
				backdropComponent={renderBackdrop}
				footerComponent={renderFooter}
			>
				<BottomSheetScrollView
					style={styles.content}
					contentContainerStyle={styles.scrollContent}
					scrollEnabled={false}
					enableFooterMarginAdjustment
				>
					<UserVoiceView
						closeBottomSheet={closeBottomSheet}
						value={input}
						onChangeText={setInput}
						hideSubmitButton
					/>
				</BottomSheetScrollView>
			</BottomSheetModal>
		</UserVoiceBottomSheetContext.Provider>
	);
};

const styles = StyleSheet.create({
	content: {
		flex: 1,
	},
	scrollContent: {
		flexGrow: 1,
	},
	footer: {
		paddingHorizontal: s(24),
	},
});
