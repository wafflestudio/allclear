import type { ReactElement, ReactNode } from "react";
import {
	Keyboard,
	StyleSheet,
	type TextInputProps,
	type TextStyle,
} from "react-native";
import EditProfileScreen from "@/features/mypage/screens/EditProfileScreen";
import TextField from "@/shared/components/TextField";
import UserVoiceView from "@/shared/components/UserVoiceView";
import { Colors } from "@/shared/constants/colors";

jest.mock("react", () => {
	const actual = jest.requireActual("react");
	return {
		...actual,
		useContext: () => ({
			userService: {
				createUserVoice: jest.fn(),
				getUser: jest.fn(),
				listCollegeMajors: jest.fn(),
				updateUser: jest.fn(),
			},
		}),
		useRef: () => ({ current: null }),
		useState: (initialValue: unknown) => [initialValue, jest.fn()],
	};
});

jest.mock("@tanstack/react-query", () => ({
	useQuery: () => ({
		data: [
			{ id: 1, college: "공과대학", major: "컴퓨터공학부" },
			{ id: 2, college: "공과대학", major: "전기정보공학부" },
		],
	}),
}));

jest.mock("react-native-dropdown-picker", () => ({
	__esModule: true,
	default: "DropDownPicker",
}));

jest.mock("react-native-safe-area-context", () => ({
	SafeAreaView: "SafeAreaView",
	useSafeAreaInsets: () => ({ bottom: 0 }),
}));

jest.mock("react-native-toast-message", () => ({
	__esModule: true,
	default: { show: jest.fn() },
}));

jest.mock("react-native-vector-icons/MaterialCommunityIcons", () => ({
	__esModule: true,
	default: "CommunityIcon",
}));

jest.mock("react-native-vector-icons/MaterialIcons", () => ({
	__esModule: true,
	default: "MaterialIcon",
}));

jest.mock("@gorhom/bottom-sheet", () => ({
	BottomSheetTextInput: "BottomSheetTextInput",
	TouchableOpacity: "BottomSheetTouchableOpacity",
}));

jest.mock("@/shared/components/BackHeader", () => ({
	__esModule: true,
	default: "BackHeader",
}));

jest.mock("@/shared/contexts/profileContext", () => ({
	useProfile: () => ({
		user: {
			nickname: "올클",
			collegeMajor: { college: "공과대학", major: "컴퓨터공학부" },
			admissionClass: 26,
		},
		setUser: jest.fn(),
	}),
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
	const matches = predicate(element) ? [element] : [];
	const children = element.props.children;

	return [
		...matches,
		...(Array.isArray(children)
			? children.flatMap((child) => findAll(child, predicate))
			: findAll(children as ReactNode, predicate)),
	];
};

describe("TestFlight QA UI regressions", () => {
	it("keeps the college dropdown above the major picker", () => {
		const screen = EditProfileScreen();
		const pickers = findAll(
			screen,
			(element) => element.type === "DropDownPicker",
		);

		expect(pickers).toHaveLength(2);
		expect(pickers[0].props).toMatchObject({
			zIndex: 2000,
			zIndexInverse: 1000,
		});
		expect(pickers[1].props).toMatchObject({
			zIndex: 1000,
			zIndexInverse: 2000,
		});
		const majorPickerStyle = StyleSheet.flatten(
			pickers[1].props.style as TextStyle,
		);
		const collegePickerStyle = StyleSheet.flatten(
			pickers[0].props.style as TextStyle,
		);
		expect(majorPickerStyle.paddingHorizontal).toBe(
			collegePickerStyle.paddingHorizontal,
		);
	});

	it("uses a readable feedback placeholder without a sheet-wide touch handler", () => {
		const dismissSpy = jest.spyOn(Keyboard, "dismiss");
		const view = UserVoiceView({ closeBottomSheet: jest.fn() });
		const [input] = findAll(
			view,
			(element) =>
				element.props.placeholder === "여기에 의견을 적어주세요. (1000자 이내)",
		);

		expect(input.props).toMatchObject({
			returnKeyType: "default",
			submitBehavior: "newline",
			placeholderTextColor: Colors.BODYTEXT_SUB,
		});
		expect(dismissSpy).not.toHaveBeenCalled();
	});

	it("keeps feedback content flexible with a disabled submit button", () => {
		const view = UserVoiceView({ closeBottomSheet: jest.fn() });
		const contentStyle = StyleSheet.flatten(view.props.style as TextStyle);
		const [input] = findAll(
			view,
			(element) =>
				element.props.placeholder === "여기에 의견을 적어주세요. (1000자 이내)",
		);
		const inputStyle = StyleSheet.flatten(input.props.style as TextStyle);
		const [submitButton] = findAll(
			view,
			(element) =>
				element.props.disabled === true &&
				typeof element.props.onPress === "function",
		);
		expect(contentStyle.flex).toBe(1);
		expect(inputStyle.flex).toBe(1);
		expect(submitButton.props.disabled).toBe(true);
	});

	it("keeps entered single-line text vertically centered", () => {
		type TextFieldComponent = (
			props: TextInputProps & { height?: number },
		) => ReactElement<{
			children: ReactElement<{ style: TextStyle }>;
			style: TextStyle;
		}>;
		const textFieldComponent = (
			TextField as unknown as { type: TextFieldComponent }
		).type;
		const field = textFieldComponent({ value: "홍길동", height: 54 });
		const input = field.props.children as ReactElement<{ style: TextStyle }>;
		const flattenedStyle = StyleSheet.flatten(input.props.style);

		expect(flattenedStyle.paddingVertical).toBe(0);
		expect(flattenedStyle.lineHeight).toBeUndefined();
	});
});
