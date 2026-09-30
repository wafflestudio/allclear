import { useRef } from "react";
import {
	useSafeAreaFrame,
	useSafeAreaInsets,
} from "react-native-safe-area-context";
import { getAndroidEntrySplashOrigin } from "@/shared/utils/androidEntrySplash";
import {
	type EntrySplashLayoutMetrics,
	getEntrySplashViewport,
	resolveEntrySplashLayoutMetrics,
} from "@/shared/utils/entrySplash";

const useEntrySplashViewport = () => {
	const frame = useSafeAreaFrame();
	const insets = useSafeAreaInsets();
	const initialMetricsRef = useRef<EntrySplashLayoutMetrics | null>(null);
	const currentMetrics = {
		width: frame.width,
		height: frame.height,
		topInset: insets.top,
		bottomInset: insets.bottom,
	};
	const layoutMetrics = resolveEntrySplashLayoutMetrics(
		initialMetricsRef.current,
		currentMetrics,
	);

	initialMetricsRef.current = layoutMetrics;

	return {
		...getEntrySplashViewport(layoutMetrics),
		androidSymbolOrigin: getAndroidEntrySplashOrigin(
			layoutMetrics.width,
			layoutMetrics.height,
			layoutMetrics.topInset,
		),
	};
};

export default useEntrySplashViewport;
