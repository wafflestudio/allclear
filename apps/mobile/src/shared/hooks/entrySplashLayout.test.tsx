import { Platform, StyleSheet } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import EntryLoginActions from "../components/EntryLoginActions";
import { getAndroidEntrySplashOrigin } from "../utils/androidEntrySplash";
import { getEntrySplashViewport } from "../utils/entrySplash";
import useIosStyles from "./useEntrySplashAnimatedStyles";
import useAndroidStyles from "./useEntrySplashAnimatedStyles.android";

jest.mock("react", () => ({
	...jest.requireActual("react"),
	useMemo: (factory: () => unknown) => factory(),
}));
jest.mock("react-native-reanimated", () => ({
	__esModule: true,
	default: { View: "AnimatedView" },
	Extrapolation: { CLAMP: "clamp" },
	useDerivedValue: (factory: () => number) => ({ value: factory() }),
	useAnimatedStyle: (factory: () => unknown) => factory(),
	// Deterministic interpolation at stage boundaries; no native animation timing.
	interpolate: (value: number, input: number[], output: number[]) => {
		if (value <= input[0]) return output[0];
		for (let i = 1; i < input.length; i++) {
			if (value <= input[i])
				return (
					output[i - 1] +
					((output[i] - output[i - 1]) * (value - input[i - 1])) /
						(input[i] - input[i - 1])
				);
		}
		return output[output.length - 1];
	},
}));

const shared = (value: number) => ({ value }) as SharedValue<number>;
const originalPlatform = Platform.OS;
afterEach(() => {
	Platform.OS = originalPlatform;
});

describe.each(["ios", "android"] as const)("%s splash layout", (platform) => {
	it.each([
		[390, 844, 47, 34],
		[402, 874, 59, 34],
		[360, 800, 24, 48],
	])(
		"preserves the native handoff and login positions at %s x %s",
		(width, height, topInset, bottomInset) => {
			Platform.OS = platform;
			const viewport = getEntrySplashViewport(
				{ width, height, topInset, bottomInset },
				platform,
			);
			const nativeTop = (height - 844) / 2 - topInset;
			const useStyles = platform === "ios" ? useIosStyles : useAndroidStyles;
			for (const stage of [0, 1, 2, 3]) {
				// biome-ignore lint/correctness/useHookAtTopLevel: Hooks are replaced with deterministic evaluators in this layout-only test.
				const result = useStyles({
					...viewport,
					androidSymbolOrigin: getAndroidEntrySplashOrigin(
						width,
						height,
						topInset,
					),
					introProgress: shared(stage),
					loginProgress: shared(0),
					screenOpacity: shared(1),
				});
				const symbol = result.symbolStyle;
				expect(symbol.width).toBe(81);
				expect(symbol.height).toBe(81);
				if (platform === "ios") {
					expect(symbol.top).toBeCloseTo(
						nativeTop + (stage === 3 ? 337.56 : 396.56),
					);
					if (stage === 0)
						expect(symbol.left).toBeCloseTo((width - 390) / 2 + 160.56);
					expect(result.taglineLayoutStyle.fontFamily).toBe(
						"Apple SD Gothic Neo",
					);
					expect(result.taglineLayoutStyle.fontSize).toBe(18);
				} else {
					const expectedLeft =
						stage === 0
							? (width - 81) / 2
							: (([0, 111.03, 79, 78.59][stage] + 80.906 / 2) * width) / 402 -
								81 / 2;
					const expectedTop =
						stage === 0
							? (height - 81) / 2 - topInset
							: (((stage === 3 ? 337.56 : 396.56) + 80.906 / 2) *
									(height - topInset - bottomInset)) /
									874 -
								81 / 2;
					expect(symbol.left).toBeCloseTo(expectedLeft);
					expect(symbol.top).toBeCloseTo(expectedTop);
					expect(result.taglineLayoutStyle.fontFamily).toBe("Pretendard-Bold");
					expect(result.taglineLayoutStyle.fontSize).toBeCloseTo(
						(18 * width) / 402,
					);
				}
			}
			const actions = EntryLoginActions({
				isLoading: false,
				isReady: true,
				onAppleButtonPress: jest.fn(),
				onGuestEntryPress: jest.fn(),
				onKakaoButtonPress: jest.fn(),
				nativeSplashContentTop: nativeTop,
				...viewport,
				visualProgress: shared(3),
			});
			const [login, guest] = actions.props.children;
			expect(StyleSheet.flatten(login.props.style).top).toBeCloseTo(
				platform === "ios"
					? nativeTop + 468.44
					: (468.44 * (height - topInset - bottomInset)) / 874,
			);
			expect(
				StyleSheet.flatten(guest.props.style({ pressed: false })).top,
			).toBeCloseTo(
				platform === "ios"
					? nativeTop + 812
					: (812 * (height - topInset - bottomInset)) / 874,
			);
		},
	);
});
