import type { ReactElement, ReactNode } from "react";
import { Animated, StyleSheet } from "react-native";
import ManagementGuideModal, { type GuideType } from ".";

// Exercise scene identity and timer lifecycle; native image decoding still needs
// a cold-start device check. Follow the repository's direct-component convention.
let mockCells: unknown[] = [];
let mockCursor = 0;
let mockEffects: (() => void)[] = [];
let mockCleanups: (() => void)[] = [];
let mockReducedMotion = false;

jest.mock("react", () => ({
	...jest.requireActual("react"),
	useMemo: (factory: () => unknown) => factory(),
	useRef: (initial: unknown) => {
		const index = mockCursor++;
		if (!(index in mockCells)) mockCells[index] = { current: initial };
		return mockCells[index];
	},
	useState: (initial: unknown) => {
		const index = mockCursor++;
		if (!(index in mockCells)) mockCells[index] = initial;
		return [mockCells[index], (next: unknown) => (mockCells[index] = next)];
	},
	useEffect: (effect: () => (() => void) | undefined, deps: unknown[]) => {
		const index = mockCursor++;
		const previous = mockCells[index] as unknown[] | undefined;
		if (previous && deps.every((dep, i) => Object.is(dep, previous[i]))) return;
		mockEffects.push(() => {
			mockCleanups[index]?.();
			mockCells[index] = deps;
			mockCleanups[index] = effect() ?? (() => {});
		});
	},
}));

jest.mock("@react-native-community/blur", () => ({ BlurView: "BlurView" }));
jest.mock("react-native-linear-gradient", () => "LinearGradient");
jest.mock("react-native-reanimated", () => ({
	useReducedMotion: () => mockReducedMotion,
}));

type Element = ReactElement<Record<string, unknown>>;
type Component = (props: Record<string, unknown>) => Element;
const findPage = (node: ReactNode, type: GuideType): Element | undefined => {
	if (!node || typeof node !== "object" || !("props" in node)) return;
	const element = node as Element;
	if ((element.props.item as { id?: string } | undefined)?.id === type)
		return element;
	const children = element.props.children;
	for (const child of Array.isArray(children) ? children : [children]) {
		const page = findPage(child as ReactNode, type);
		if (page) return page;
	}
};

const getAutoStates = (type: GuideType) => {
	const modal = ManagementGuideModal({
		visible: true,
		type,
		onStart: jest.fn(),
		onSkip: jest.fn(),
	});
	const page = findPage(modal, type);
	if (!page) throw new Error(`Missing guide page: ${type}`);
	const content = (page.type as Component)(page.props);
	const scene = (content.props.children as Element[])[1];
	resetHooks();
	return (active = true) => {
		mockCursor = 0;
		mockEffects = [];
		const tree = (scene.type as Component)({ ...scene.props, active });
		for (const effect of mockEffects) effect();
		return (tree.props.children as ReactNode[])
			.flat()
			.filter(Boolean) as Element[];
	};
};

const resetHooks = () => {
	mockCells = [];
	mockCursor = 0;
	mockEffects = [];
	mockCleanups = [];
};
const scene = (layer: Element) => layer.props.children as Element;
const opacity = (layer: Element) =>
	StyleSheet.flatten(layer.props.style as { opacity: Animated.Value }[])
		.opacity;

describe("management guide transitions", () => {
	const animations: {
		finish: () => void;
		stop: jest.Mock;
	}[] = [];

	beforeEach(() => {
		jest.useFakeTimers();
		resetHooks();
		mockReducedMotion = false;
		animations.length = 0;
		jest.spyOn(Animated, "timing").mockImplementation((value, config) => {
			let finish = () => {};
			const stop = jest.fn();
			animations.push({ finish: () => finish(), stop });
			return {
				start: (callback) => {
					finish = () => {
						(value as Animated.Value).setValue(config.toValue as number);
						callback?.({ finished: true });
					};
				},
				stop,
				reset: jest.fn(),
			};
		});
	});

	afterEach(() => {
		for (const cleanup of mockCleanups) cleanup?.();
		jest.restoreAllMocks();
		jest.useRealTimers();
	});

	it.each(["clubRegistration", "announcementRegistration"] as const)(
		"%s retains each scene and opacity through both fade completions",
		(type) => {
			const render = getAutoStates(type);
			const initial = render();
			expect(initial.map((layer) => scene(layer).props.state)).toEqual([
				"first",
				"second",
				"third",
			]);

			for (const index of [1, 2]) {
				jest.advanceTimersByTime(800);
				expect(animations).toHaveLength(index);
				animations[index - 1].finish();
				const settled = render();
				for (const [i, layer] of settled.entries()) {
					expect(layer.key).toBe(initial[i].key);
					expect(scene(layer).type).toBe(scene(initial[i]).type);
					expect(scene(layer).props.state).toBe(scene(initial[i]).props.state);
					expect(opacity(layer)).toBe(opacity(initial[i]));
				}
				expect(opacity(settled[index])).toEqual(
					expect.objectContaining({ _value: 1 }),
				);
				expect(scene(settled[index]).props.active).toBe(true);
			}
			jest.advanceTimersByTime(5000);
			expect(animations).toHaveLength(2);
		},
	);

	it("cancels an interrupted fade and resets the layers before replay", () => {
		const render = getAutoStates("announcementRegistration");
		render();
		jest.advanceTimersByTime(800);
		render(false);
		expect(animations[0].stop).toHaveBeenCalledTimes(1);
		const replay = render();
		for (const [index, layer] of replay.entries()) {
			expect(opacity(layer)).toEqual(
				expect.objectContaining({ _value: index === 0 ? 1 : 0 }),
			);
		}
		expect(scene(replay[0]).props.active).toBe(true);
		jest.advanceTimersByTime(800);
		expect(animations).toHaveLength(2);
	});

	it("keeps the initial scene still when reduced motion is enabled", () => {
		mockReducedMotion = true;
		const render = getAutoStates("clubRegistration");
		const layers = render();
		jest.advanceTimersByTime(5000);
		expect(animations).toHaveLength(0);
		expect(scene(layers[0]).props.active).toBe(true);
	});
});
