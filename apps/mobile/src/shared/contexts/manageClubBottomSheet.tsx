import {
	BottomSheetBackdrop,
	type BottomSheetBackdropProps,
	BottomSheetModal,
	BottomSheetView,
} from "@gorhom/bottom-sheet";
import type React from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
} from "react";
import { BackHandler } from "react-native";
import ManageClubView from "@/shared/components/ManageClubView";

const ManageClubBottomSheetContext = createContext<{
	openBottomSheet: () => void;
	closeBottomSheet: () => void;
}>({
	openBottomSheet: () => {},
	closeBottomSheet: () => {},
});

export const useManageClubBottomSheet = () =>
	useContext(ManageClubBottomSheetContext);

type Props = {
	children: React.ReactNode;
};

export const ManageClubBottomSheetProvider = ({ children }: Props) => {
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
		<ManageClubBottomSheetContext.Provider
			value={{
				openBottomSheet,
				closeBottomSheet,
			}}
		>
			{children}
			<BottomSheetModal
				ref={bottomSheetModalRef}
				index={0}
				snapPoints={[370]}
				enableDynamicSizing={false}
				onDismiss={() => {
					isBottomSheetOpenRef.current = false;
				}}
				backdropComponent={renderBackdrop}
				// Remove the default handle visible on top of the sheet to match Figma
				handleComponent={() => null}
				enableHandlePanningGesture={false}
				handleIndicatorStyle={{ height: 0 }}
			>
				<BottomSheetView style={{ flex: 1 }}>
					<ManageClubView closeBottomSheet={closeBottomSheet} />
				</BottomSheetView>
			</BottomSheetModal>
		</ManageClubBottomSheetContext.Provider>
	);
};
