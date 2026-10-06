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
	useState,
} from "react";
import { BackHandler, Platform } from "react-native";
import LoginView from "@/shared/components/LoginView";
import { vs } from "@/shared/utils/scale";

const LoginBottomSheetContext = createContext<{
	openBottomSheet: (onSuccess?: () => void) => void;
	closeBottomSheet: () => void;
	isOpen: boolean;
} | null>(null);

export const useLoginBottomSheet = () => {
	const ctx = useContext(LoginBottomSheetContext);
	if (!ctx) throw new Error("LoginBottomSheetProvider 안에서 사용해야 합니다");
	return ctx;
};

type Props = {
	children: React.ReactNode;
};

export const LoginBottomSheetProvider = ({ children }: Props) => {
	const bottomSheetModalRef = useRef<BottomSheetModal>(null);
	const isBottomSheetOpenRef = useRef(false);
	const onSuccessRef = useRef<(() => void) | undefined>(undefined);
	const [isOpen, setIsOpen] = useState(false);

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

	const openBottomSheet = useCallback((onSuccess?: () => void) => {
		isBottomSheetOpenRef.current = true;
		setIsOpen(true);
		onSuccessRef.current = onSuccess;
		bottomSheetModalRef.current?.present();
	}, []);

	const closeBottomSheet = useCallback(() => {
		bottomSheetModalRef.current?.close();
	}, []);

	const callOnSuccess = useCallback(() => {
		onSuccessRef.current?.();
		onSuccessRef.current = undefined;
	}, []);

	useEffect(() => {
		if (Platform.OS !== "android") return;
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
		<LoginBottomSheetContext.Provider
			value={{
				openBottomSheet,
				closeBottomSheet,
				isOpen,
			}}
		>
			{children}
			<BottomSheetModal
				ref={bottomSheetModalRef}
				index={0}
				snapPoints={[Platform.OS === "ios" ? vs(310) : vs(260)]}
				enableDynamicSizing={false}
				onDismiss={() => {
					isBottomSheetOpenRef.current = false;
					setIsOpen(false);
					// 로그인 없이 닫힌 경우 stale 콜백이 다음 로그인에 잘못 실행되지 않도록 정리
					onSuccessRef.current = undefined;
				}}
				backdropComponent={renderBackdrop}
			>
				<BottomSheetView style={{ flex: 1 }}>
					<LoginView
						closeBottomSheet={closeBottomSheet}
						onSuccess={callOnSuccess}
					/>
				</BottomSheetView>
			</BottomSheetModal>
		</LoginBottomSheetContext.Provider>
	);
};
