import {
	BottomSheetBackdrop,
	type BottomSheetBackdropProps,
	BottomSheetModal,
} from "@gorhom/bottom-sheet";
import type React from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
} from "react";
import { BackHandler, Platform } from "react-native";
import UserVoiceView from "@/shared/components/UserVoiceView";

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
				snapPoints={[Platform.OS === "ios" ? 400 : 350]}
				onDismiss={() => {
					isBottomSheetOpenRef.current = false;
				}}
				backdropComponent={renderBackdrop}
			>
				<UserVoiceView closeBottomSheet={closeBottomSheet} />
			</BottomSheetModal>
		</UserVoiceBottomSheetContext.Provider>
	);
};
