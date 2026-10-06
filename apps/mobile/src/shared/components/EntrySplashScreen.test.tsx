import type { ReactElement, ReactNode } from "react";
import { NativeModules, Platform } from "react-native";
import SplashScreen from "react-native-splash-screen";
import EntrySplashScreen from "./EntrySplashScreen";

// Match the repository's direct-component test convention. This harness checks
// JS event/state gating, not native rendering, image decoding, or frame timing.
let mockStates: unknown[] = [];
let mockCursor = 0;
let mockEffects: (() => unknown)[] = [];
const mockIntroSequence = jest.fn((..._values: number[]) => 2);

jest.mock("react", () => ({
	...jest.requireActual("react"),
	useCallback: (callback: unknown) => callback,
	useMemo: (factory: () => unknown) => factory(),
	useEffect: (effect: () => unknown) => mockEffects.push(effect),
	useState: (initial: unknown) => {
		const index = mockCursor++;
		if (!(index in mockStates)) mockStates[index] = initial;
		return [
			mockStates[index],
			(next: unknown) => {
				mockStates[index] =
					typeof next === "function" ? next(mockStates[index]) : next;
			},
		];
	},
}));

jest.mock("react-native-reanimated", () => {
	const React = jest.requireMock("react");
	const { View, Image, Text } = jest.requireActual("react-native");
	return {
		__esModule: true,
		default: { View, Image, Text },
		Easing: { bezier: jest.fn() },
		runOnJS: (callback: unknown) => callback,
		useReducedMotion: () => false,
		useSharedValue: (value: number) => React.useState({ value })[0],
		withDelay: (_delay: number, value: number) => value,
		withSequence: (...values: number[]) => mockIntroSequence(...values),
		withTiming: (value: number) => value,
	};
});

jest.mock("react-native-splash-screen", () => ({
	__esModule: true,
	default: { hide: jest.fn() },
}));
jest.mock("@/shared/contexts/profileContext", () => ({
	useProfile: () => ({ user: null, isLoading: true }),
}));
jest.mock("@/shared/hooks/useLoginActions", () => ({
	__esModule: true,
	default: () => ({ isLoading: false }),
}));
jest.mock("@/shared/components/EntryLoginActions", () => ({
	__esModule: true,
	default: "EntryLoginActions",
}));
jest.mock("@/shared/hooks/useEntrySplashAnimatedStyles", () => ({
	__esModule: true,
	default: () => ({}),
}));
jest.mock("@/shared/hooks/useEntrySplashViewport", () => ({
	__esModule: true,
	default: () => ({
		contentTop: 24,
		contentBottom: 24,
		nativeSplashTop: 0,
		nativeSplashLeft: 0,
		scaleX: 1,
		scaleY: 1,
	}),
}));

type Element = ReactElement<Record<string, unknown>>;
const findAll = (node: ReactNode, prop: string): Element[] => {
	if (!node || typeof node !== "object" || !("props" in node)) return [];
	const element = node as Element;
	const children = element.props.children;
	return [
		...(prop in element.props ? [element] : []),
		...(Array.isArray(children)
			? children.flatMap((child) => findAll(child, prop))
			: findAll(children as ReactNode, prop)),
	];
};
const fire = (element: Element, prop: string) =>
	(element.props[prop] as () => void)();
const render = (active = true) => {
	mockCursor = 0;
	mockEffects = [];
	const screen = EntrySplashScreen({ active, onComplete: jest.fn() });
	for (const effect of mockEffects) effect();
	return screen;
};
const runFrame = () => jest.runOnlyPendingTimers();

describe("EntrySplashScreen platform handoff", () => {
	const originalPlatform = Platform.OS;
	const originalEntrySplash = NativeModules.EntrySplash;
	beforeEach(() => {
		jest.useFakeTimers();
		mockStates = [];
		mockIntroSequence.mockClear();
		jest.mocked(SplashScreen.hide).mockClear();
		NativeModules.EntrySplash = { ready: jest.fn() };
		jest
			.spyOn(global, "requestAnimationFrame")
			.mockImplementation((callback) =>
				Number(setTimeout(() => callback(0), 0)),
			);
	});
	afterEach(() => {
		Platform.OS = originalPlatform;
		NativeModules.EntrySplash = originalEntrySplash;
		jest.restoreAllMocks();
		jest.useRealTimers();
	});

	it.each(["layout-first", "load-first"])(
		"iOS waits for clone layout and load (%s), but not Android assets",
		(order) => {
			Platform.OS = "ios";
			const screen = render();
			const clone = findAll(screen, "resizeMode").find(
				(element) => element.props.resizeMode === "center",
			);
			expect(clone).toBeDefined();
			const cloneLayout = findAll(screen, "onLayout")[1];
			const layout = () => fire(cloneLayout, "onLayout");
			const load = () => fire(clone as Element, "onLoadEnd");
			const [first, second] =
				order === "layout-first" ? [layout, load] : [load, layout];
			first();
			render();
			runFrame();
			expect(SplashScreen.hide).not.toHaveBeenCalled();
			expect(mockIntroSequence).not.toHaveBeenCalled();
			second();
			render();
			expect(mockIntroSequence).not.toHaveBeenCalled();
			runFrame();
			const released = render();
			expect(SplashScreen.hide).toHaveBeenCalledTimes(1);
			expect(NativeModules.EntrySplash.ready).not.toHaveBeenCalled();
			expect(mockIntroSequence).toHaveBeenCalledTimes(1);
			expect(findAll(released, "resizeMode")).toHaveLength(0);
		},
	);

	it.each(["layout-first", "assets-first"])(
		"Android waits for layout and all four unique assets (%s), not iOS clone",
		(order) => {
			Platform.OS = "android";
			const screen = render();
			const assets = findAll(screen, "onLoadEnd");
			expect(assets).toHaveLength(4);
			if (order === "layout-first") fire(screen, "onLayout");
			for (const asset of assets.slice(0, 3)) fire(asset, "onLoadEnd");
			fire(assets[0], "onLoadEnd");
			render();
			runFrame();
			expect(NativeModules.EntrySplash.ready).not.toHaveBeenCalled();
			expect(mockIntroSequence).not.toHaveBeenCalled();
			fire(assets[3], "onLoadEnd");
			render();
			if (order === "assets-first") {
				runFrame();
				expect(NativeModules.EntrySplash.ready).not.toHaveBeenCalled();
				fire(screen, "onLayout");
				render();
			}
			expect(mockIntroSequence).not.toHaveBeenCalled();
			runFrame();
			render();
			expect(NativeModules.EntrySplash.ready).toHaveBeenCalledTimes(1);
			expect(SplashScreen.hide).not.toHaveBeenCalled();
			expect(mockIntroSequence).toHaveBeenCalledTimes(1);
		},
	);

	it.each(["ios", "android"] as const)(
		"%s does not release or animate while inactive, even when prepared",
		(platform) => {
			Platform.OS = platform;
			const screen = render(false);
			for (const node of findAll(screen, "onLayout")) fire(node, "onLayout");
			for (const node of findAll(screen, "onLoadEnd")) fire(node, "onLoadEnd");
			render(false);
			runFrame();
			expect(SplashScreen.hide).not.toHaveBeenCalled();
			expect(NativeModules.EntrySplash.ready).not.toHaveBeenCalled();
			expect(mockIntroSequence).not.toHaveBeenCalled();
			render(true);
			runFrame();
			render(true);
			expect(mockIntroSequence).toHaveBeenCalledTimes(1);
		},
	);
});
