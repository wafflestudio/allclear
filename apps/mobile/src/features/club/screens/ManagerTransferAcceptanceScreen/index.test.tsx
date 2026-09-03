import type { ReactElement, ReactNode } from "react";
import { StyleSheet } from "react-native";
import ManagerTransferAcceptanceScreen from "@/features/club/screens/ManagerTransferAcceptanceScreen";
import Button, { type ButtonProps } from "@/shared/components/Button";

const mockOpenBottomSheet = jest.fn();
const mockInvalidateQueries = jest.fn();
let mockUser: unknown = null;

jest.mock("react", () => {
	const actual = jest.requireActual("react");
	return {
		...actual,
		useCallback: (callback: unknown) => callback,
		useContext: () => ({
			clubService: {
				getManagerTransferInvitation: jest.fn(),
				acceptManagerTransferInvitation: jest.fn(),
			},
		}),
		useEffect: (effect: () => void) => effect(),
		useRef: (initialValue: unknown) => ({ current: initialValue }),
		useState: (initialValue: unknown) => [initialValue, jest.fn()],
	};
});

jest.mock("@tanstack/react-query", () => ({
	useMutation: () => ({ isPending: false, mutate: jest.fn() }),
	useQuery: () => ({
		data: undefined,
		error: null,
		isLoading: false,
		refetch: jest.fn(),
	}),
	useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

jest.mock("@react-native-clipboard/clipboard", () => ({
	__esModule: true,
	default: { setString: jest.fn() },
}));

jest.mock("react-native-safe-area-context", () => ({
	SafeAreaView: "SafeAreaView",
}));

jest.mock("@/shared/components/AlertModal", () => ({
	__esModule: true,
	default: "AlertModal",
}));

jest.mock("@/shared/components/BackHeader", () => ({
	__esModule: true,
	default: "BackHeader",
}));

jest.mock("@/shared/contexts/appModalFlowContext", () => ({
	useAppModalFlow: () => ({ state: "settled" }),
}));

jest.mock("@/shared/contexts/loginBottomSheetContext", () => ({
	useLoginBottomSheet: () => ({ openBottomSheet: mockOpenBottomSheet }),
}));

jest.mock("@/shared/contexts/profileContext", () => ({
	useProfile: () => ({ user: mockUser, isLoading: false }),
}));

type ElementWithProps = ReactElement<Record<string, unknown>>;

const findAll = (
	node: ReactNode,
	predicate: (element: ElementWithProps) => boolean,
): ElementWithProps[] => {
	if (node == null || typeof node !== "object" || !("props" in node)) return [];

	const element = node as ElementWithProps;
	const matches = predicate(element) ? [element] : [];
	const children = element.props.children;

	return [
		...matches,
		...(Array.isArray(children)
			? children.flatMap((child) => findAll(child, predicate))
			: findAll(children as ReactNode, predicate)),
	];
};

const renderScreen = () =>
	ManagerTransferAcceptanceScreen({
		route: { params: { token: "a".repeat(43) } },
		navigation: { replace: jest.fn() },
	} as never);

describe("manager transfer acceptance login flow", () => {
	beforeEach(() => {
		mockUser = null;
		mockOpenBottomSheet.mockClear();
		mockInvalidateQueries.mockClear();
	});

	it("게스트 진입 시 로그인 바텀시트를 자동으로 연다", () => {
		renderScreen();

		expect(mockOpenBottomSheet).toHaveBeenCalledTimes(1);
	});

	it("게스트가 화면 CTA로 로그인 바텀시트를 다시 열 수 있다", () => {
		const screen = renderScreen();
		const [loginButton] = findAll(
			screen,
			(element) =>
				element.type === Button &&
				element.props.label === "로그인하고 권한 받기",
		);

		expect(loginButton).toBeDefined();
		(loginButton.props.onPress as () => void)();
		expect(mockOpenBottomSheet).toHaveBeenCalledTimes(2);
	});

	it("게스트 CTA는 카드 너비를 채우고 콘텐츠 높이를 유지한다", () => {
		const screen = renderScreen();
		const [loginButton] = findAll(
			screen,
			(element) =>
				element.type === Button &&
				element.props.label === "로그인하고 권한 받기",
		);
		const pressable = Button(loginButton.props as ButtonProps);
		const style = StyleSheet.flatten(pressable.props.style({ pressed: false }));

		// 공용 Button의 기본 flex까지 합친 최종 스타일을 확인한다.
		expect(style).toMatchObject({ flex: 0, width: "100%" });
		expect(style.height).toBeUndefined();
	});

	it("바텀시트 로그인 성공 후 약관 상태를 다시 확인한다", () => {
		renderScreen();
		const [onSuccess] = mockOpenBottomSheet.mock.calls[0] as [() => void];

		onSuccess();
		expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["terms"] });
	});

	it("로그인 상태에서는 로그인 바텀시트를 열지 않는다", () => {
		mockUser = { uuid: "user-1" };

		renderScreen();

		expect(mockOpenBottomSheet).not.toHaveBeenCalled();
	});
});
