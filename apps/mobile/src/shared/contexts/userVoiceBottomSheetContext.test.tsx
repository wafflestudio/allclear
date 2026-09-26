import type { ReactElement, ReactNode } from "react";
import { Platform } from "react-native";
import { UserVoiceBottomSheetProvider } from "@/shared/contexts/userVoiceBottomSheetContext";

jest.mock("react", () => {
	const actual = jest.requireActual("react");
	return {
		...actual,
		useCallback: (callback: unknown) => callback,
		useContext: () => ({ userService: { createUserVoice: jest.fn() } }),
		useEffect: jest.fn(),
		useRef: () => ({ current: null }),
		useState: (value: unknown) => [value, jest.fn()],
	};
});

jest.mock("@gorhom/bottom-sheet", () => ({
	BottomSheetBackdrop: "BottomSheetBackdrop",
	BottomSheetFooter: "BottomSheetFooter",
	BottomSheetModal: "BottomSheetModal",
	BottomSheetScrollView: "BottomSheetScrollView",
	BottomSheetTextInput: "BottomSheetTextInput",
}));

jest.mock("@/shared/components/UserVoiceView", () => ({
	__esModule: true,
	UserVoiceSubmitButton: "UserVoiceSubmitButton",
	default: "UserVoiceView",
}));

jest.mock("react-native-toast-message", () => ({
	__esModule: true,
	default: { show: jest.fn() },
}));

jest.mock("react-native-safe-area-context", () => ({
	useSafeAreaInsets: () => ({ bottom: 0 }),
}));

type ElementWithProps = ReactElement<Record<string, unknown>>;

const findAll = (
	node: ReactNode,
	predicate: (element: ElementWithProps) => boolean,
): ElementWithProps[] => {
	if (node == null || typeof node !== "object" || !("props" in node)) {
		return [];
	}

	const element = node as ElementWithProps;
	const children = element.props.children;

	return [
		...(predicate(element) ? [element] : []),
		...(Array.isArray(children)
			? children.flatMap((child) => findAll(child, predicate))
			: findAll(children as ReactNode, predicate)),
	];
};

describe("UserVoiceBottomSheetProvider", () => {
	it("restores or closes the sheet instead of leaving it partially dragged", () => {
		const provider = UserVoiceBottomSheetProvider({ children: null });
		const [modal] = findAll(
			provider,
			(element) => element.type === "BottomSheetModal",
		);

		expect(modal.props).toMatchObject({
			enablePanDownToClose: true,
			enableBlurKeyboardOnGesture: true,
			keyboardBlurBehavior: "restore",
			snapPoints: [Platform.OS === "ios" ? 440 : 420],
			bottomInset: 0,
		});
	});
});
