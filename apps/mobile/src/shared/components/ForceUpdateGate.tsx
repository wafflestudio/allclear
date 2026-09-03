import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Linking } from "react-native";
import AlertModal from "@/shared/components/AlertModal";
import AppInitializationScreen from "@/shared/components/AppInitializationScreen";
import EntrySplashScreen from "@/shared/components/EntrySplashScreen";
import { useProfile } from "@/shared/contexts/profileContext";
import useForceUpdateCheck from "@/shared/hooks/useForceUpdateCheck";
import {
	APP_INITIALIZATION_LOADING_DELAY_MS,
	shouldCompleteAppEntry,
	shouldShowAppInitializationLoading,
} from "@/shared/utils/entrySplash";

type Props = {
	children: React.ReactNode;
	onEntryComplete: () => void;
};

const ForceUpdateGate = ({ children, onEntryComplete }: Props) => {
	const state = useForceUpdateCheck();
	const { isLoading: isProfileLoading } = useProfile();
	const [initializationDelayElapsed, setInitializationDelayElapsed] =
		useState(false);
	const [entryComplete, setEntryComplete] = useState(false);
	const hasNotifiedEntryComplete = useRef(false);

	useEffect(() => {
		const timer = setTimeout(
			() => setInitializationDelayElapsed(true),
			APP_INITIALIZATION_LOADING_DELAY_MS,
		);
		return () => clearTimeout(timer);
	}, []);

	const isUpdateCheckReady = state.status === "ready";
	const showInitializationScreen = shouldShowAppInitializationLoading({
		delayElapsed: initializationDelayElapsed,
		isProfileLoading,
		isUpdateCheckReady,
	});

	const handleOpenStore = useCallback((storeUrl: string) => {
		Linking.openURL(storeUrl).catch(() => {});
	}, []);

	const noop = useCallback(() => {}, []);
	const handleEntryComplete = useCallback(() => {
		setEntryComplete(true);
	}, []);

	const showUpdateModal = state.status === "ready" && state.updateRequired;

	useEffect(() => {
		const canCompleteAppEntry = shouldCompleteAppEntry({
			entrySplashComplete: entryComplete,
			isUpdateCheckReady: state.status === "ready",
			updateRequired: state.status === "ready" && state.updateRequired,
		});
		if (!canCompleteAppEntry || hasNotifiedEntryComplete.current) return;

		hasNotifiedEntryComplete.current = true;
		onEntryComplete();
	}, [entryComplete, onEntryComplete, state]);

	return (
		<>
			{children}
			{!entryComplete && (
				<EntrySplashScreen active onComplete={handleEntryComplete} />
			)}
			{showInitializationScreen && <AppInitializationScreen />}
			{showUpdateModal && (
				<AlertModal
					visible
					onClose={noop}
					title="업데이트가 필요해요"
					description={`최신 버전 (${state.minSupportedVersion})로 업데이트해 주세요!`}
					buttonLabel="확인"
					onButtonPress={() => handleOpenStore(state.storeUrl)}
					dismissOnBackdropPress={false}
				/>
			)}
		</>
	);
};

export default ForceUpdateGate;
