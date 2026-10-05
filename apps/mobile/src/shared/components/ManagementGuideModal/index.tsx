import { BlurView } from "@react-native-community/blur";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	Animated,
	Easing,
	Image,
	Modal,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useReducedMotion } from "react-native-reanimated";
import { Colors } from "@/shared/constants/colors";
import { typography } from "@/shared/constants/typography";
import { ms, s, vs } from "@/shared/utils/scale";

export type GuideType =
	| "clubRegistration"
	| "announcementRegistration"
	| "announcementManagement"
	| "approvalTime";

type Props = {
	visible: boolean;
	type: GuideType;
	onStart: () => void;
	onSkip: () => void;
};

type GuidePage = {
	id: GuideType;
	action: string;
	title: string;
};

type SceneKind = "myPage" | "registration" | "management" | "approval";
type SceneState = "first" | "second" | "third";

const pages: readonly GuidePage[] = [
	{
		id: "clubRegistration",
		action: "동아리 등록하기",
		title: "운영하고 있는 동아리가 있다면\n올클에 등록해주세요!",
	},
	{
		id: "announcementRegistration",
		action: "공고 등록하기",
		title: "신규 부원 모집을 위한\n공고를 손쉽게 등록할 수 있어요!",
	},
	{
		id: "announcementManagement",
		action: "공고 관리하기",
		title: "공고관리에서\n지난 공고들도 수정하고 관리해요",
	},
	{
		id: "approvalTime",
		action: "승인 소요기간",
		title:
			"동아리 신규 등록 및 운영진 승인은\n최대 일주일 정도 소요될 수 있어요",
	},
];

const PAGE_WIDTH = s(292);
const PREVIEW_WIDTH = s(266);
const PREVIEW_HEIGHT = vs(214);
const PROTOTYPE_TIMEOUT_MS = 800;
const PROFILE_SECOND_TIMEOUT_MS = 500;
const STATE_OVERLAY_TRANSITION_MS = 300;
const APPROVAL_OVERLAY_TRANSITION_MS = 500;
const REGISTRATION_SCROLL_STEP_MS = 300;
const REGISTRATION_IMAGE_HEIGHT = vs((226 * 4096) / 660);
const REGISTRATION_SECOND_OFFSET = -vs(640 - 26);
const REGISTRATION_THIRD_OFFSET = -vs(1167 - 26);
const FIGMA_EASE_OUT = Easing.bezier(0, 0, 0.58, 1);

const page1Profile =
	require("@/assets/images/admin-guide/page1-profile.png") as number;
const page1StatusCellular =
	require("@/assets/images/admin-guide/page1-status-cellular.png") as number;
const page1StatusWifi =
	require("@/assets/images/admin-guide/page1-status-wifi.png") as number;
const page1StatusBattery =
	require("@/assets/images/admin-guide/page1-status-battery.png") as number;
const page1Callout =
	require("@/assets/images/admin-guide/page1-callout.png") as number;
const page1Club =
	require("@/assets/images/admin-guide/page1-club.png") as number;
const page2Step1 =
	require("@/assets/images/admin-guide/page2-step1.png") as number;
const page2Step2 =
	require("@/assets/images/admin-guide/page2-step2.png") as number;
const page2Registration =
	require("@/assets/images/admin-guide/page2-registration.png") as number;
const page3Management =
	require("@/assets/images/admin-guide/page3-management.png") as number;
const page4Approval =
	require("@/assets/images/admin-guide/page4-approval.png") as number;
const page4Confirmation =
	require("@/assets/images/admin-guide/page4-confirmation.png") as number;

const ManagementGuideModal = ({ visible, type, onStart, onSkip }: Props) => {
	const reduceMotion = useReducedMotion();
	const entrance = useRef(new Animated.Value(0)).current;
	const pager = useRef<ScrollView>(null);
	const [page, setPage] = useState(0);
	const initialPage = useMemo(
		() => pages.findIndex((item) => item.id === type),
		[type],
	);
	const currentPage = pages[page] ?? pages[0];
	const usesTopAlignedSkip =
		currentPage.id === "clubRegistration" || currentPage.id === "approvalTime";

	useEffect(() => {
		if (!visible) {
			entrance.setValue(0);
			return;
		}

		setPage(initialPage);
		const frame = requestAnimationFrame(() => {
			pager.current?.scrollTo({
				x: initialPage * PAGE_WIDTH,
				animated: false,
			});
		});

		if (reduceMotion) {
			entrance.setValue(1);
			return () => cancelAnimationFrame(frame);
		}

		const animation = Animated.spring(entrance, {
			toValue: 1,
			friction: 8,
			tension: 70,
			useNativeDriver: true,
		});
		animation.start();

		return () => {
			cancelAnimationFrame(frame);
			animation.stop();
		};
	}, [entrance, initialPage, reduceMotion, visible]);

	return (
		<Modal
			transparent
			visible={visible}
			animationType={reduceMotion ? "none" : "fade"}
			onRequestClose={onSkip}
		>
			<View style={styles.overlay}>
				<BlurView
					style={styles.blur}
					blurType="light"
					blurAmount={2}
					overlayColor="transparent"
					reducedTransparencyFallbackColor="transparent"
				/>
				<Animated.View
					style={[
						styles.card,
						{
							opacity: entrance,
							transform: [
								{
									scale: entrance.interpolate({
										inputRange: [0, 1],
										outputRange: [0.94, 1],
									}),
								},
							],
						},
					]}
				>
					<View
						style={[
							styles.actions,
							usesTopAlignedSkip
								? styles.actionsTopAligned
								: styles.actionsCentered,
						]}
					>
						<TouchableOpacity
							accessibilityRole="button"
							activeOpacity={0.75}
							style={styles.action}
							onPress={onStart}
						>
							<Text style={styles.actionText}>{currentPage.action}</Text>
						</TouchableOpacity>
						<TouchableOpacity
							accessibilityRole="button"
							activeOpacity={0.75}
							hitSlop={s(8)}
							onPress={onSkip}
						>
							<Text
								style={[
									styles.skip,
									usesTopAlignedSkip ? styles.skipTall : styles.skipCompact,
								]}
							>
								건너뛰기
							</Text>
						</TouchableOpacity>
					</View>

					<ScrollView
						ref={pager}
						horizontal
						pagingEnabled
						showsHorizontalScrollIndicator={false}
						decelerationRate="fast"
						style={styles.horizontal}
						onMomentumScrollEnd={(event) => {
							const nextPage = Math.round(
								event.nativeEvent.contentOffset.x / PAGE_WIDTH,
							);
							setPage(Math.max(0, Math.min(pages.length - 1, nextPage)));
						}}
					>
						{pages.map((item, index) => (
							<GuidePageContent
								key={item.id}
								active={visible && index === page}
								item={item}
							/>
						))}
					</ScrollView>

					<View style={styles.dots}>
						{pages.map((item, index) => (
							<View
								key={item.id}
								style={index === page ? styles.activeDot : styles.dot}
							/>
						))}
					</View>
				</Animated.View>
			</View>
		</Modal>
	);
};

const GuidePageContent = ({
	active,
	item,
}: {
	active: boolean;
	item: GuidePage;
}) => {
	let scene: ReactNode;

	switch (item.id) {
		case "clubRegistration":
			scene = <AutoStates active={active} kind="myPage" />;
			break;
		case "announcementRegistration":
			scene = <AutoStates active={active} kind="registration" />;
			break;
		case "announcementManagement":
			scene = (
				<GuideScene
					active={active}
					kind="management"
					state="first"
					withTopMargin
				/>
			);
			break;
		case "approvalTime":
			scene = <AutoStates active={active} kind="approval" />;
	}

	return (
		<View style={styles.page}>
			<Text style={styles.title}>{item.title}</Text>
			{scene}
		</View>
	);
};

const AutoStates = ({
	active,
	kind,
}: {
	active: boolean;
	kind: Exclude<SceneKind, "management">;
}) => {
	const reduceMotion = useReducedMotion();
	const transitionProgress = useRef(new Animated.Value(0)).current;
	const [stateIndex, setStateIndex] = useState(0);
	const [incomingIndex, setIncomingIndex] = useState<number | null>(null);
	const states: readonly SceneState[] =
		kind === "approval" ? ["first", "second"] : ["first", "second", "third"];

	useEffect(() => {
		if (!active) {
			setStateIndex(0);
			setIncomingIndex(null);
			transitionProgress.setValue(0);
			return;
		}

		if (reduceMotion) {
			setIncomingIndex(null);
			transitionProgress.setValue(0);
			return;
		}

		if (stateIndex === states.length - 1) return;

		const holdDuration =
			kind === "myPage" && stateIndex === 1
				? PROFILE_SECOND_TIMEOUT_MS
				: PROTOTYPE_TIMEOUT_MS;
		const transitionDuration =
			kind === "approval"
				? APPROVAL_OVERLAY_TRANSITION_MS
				: STATE_OVERLAY_TRANSITION_MS;
		let frame: number | undefined;
		let animation: Animated.CompositeAnimation | undefined;
		const timer = setTimeout(() => {
			const nextIndex = stateIndex + 1;
			transitionProgress.setValue(0);
			setIncomingIndex(nextIndex);
			frame = requestAnimationFrame(() => {
				animation = Animated.timing(transitionProgress, {
					toValue: 1,
					duration: transitionDuration,
					easing: FIGMA_EASE_OUT,
					useNativeDriver: true,
				});
				animation.start(({ finished }) => {
					if (!finished) return;

					transitionProgress.setValue(1);
					setStateIndex(nextIndex);
				});
			});
		}, holdDuration);

		return () => {
			clearTimeout(timer);
			if (frame !== undefined) cancelAnimationFrame(frame);
			animation?.stop();
		};
	}, [
		active,
		kind,
		reduceMotion,
		stateIndex,
		states.length,
		transitionProgress,
	]);

	useEffect(() => {
		if (!active || incomingIndex === null || incomingIndex !== stateIndex)
			return;

		const frame = requestAnimationFrame(() => {
			setIncomingIndex(null);
			transitionProgress.setValue(0);
		});

		return () => cancelAnimationFrame(frame);
	}, [active, incomingIndex, stateIndex, transitionProgress]);

	return (
		<View pointerEvents="none" style={styles.stateOverlayMask}>
			<GuideScene
				active={active}
				kind={kind}
				state={states[stateIndex] ?? "first"}
			/>
			{incomingIndex !== null ? (
				<Animated.View
					style={[styles.incomingScene, { opacity: transitionProgress }]}
				>
					<GuideScene
						active={false}
						kind={kind}
						state={states[incomingIndex] ?? "first"}
					/>
				</Animated.View>
			) : null}
		</View>
	);
};

const GuideScene = ({
	active,
	kind,
	state,
	withTopMargin = false,
}: {
	active: boolean;
	kind: SceneKind;
	state: SceneState;
	withTopMargin?: boolean;
}) => {
	const reduceMotion = useReducedMotion();
	const registrationOffset = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		registrationOffset.setValue(0);
		if (!active || reduceMotion || kind !== "registration" || state !== "third")
			return;

		const animation = Animated.sequence([
			Animated.delay(PROTOTYPE_TIMEOUT_MS),
			Animated.timing(registrationOffset, {
				toValue: REGISTRATION_SECOND_OFFSET,
				duration: REGISTRATION_SCROLL_STEP_MS,
				easing: FIGMA_EASE_OUT,
				useNativeDriver: true,
			}),
			Animated.delay(PROTOTYPE_TIMEOUT_MS),
			Animated.timing(registrationOffset, {
				toValue: REGISTRATION_THIRD_OFFSET,
				duration: REGISTRATION_SCROLL_STEP_MS,
				easing: FIGMA_EASE_OUT,
				useNativeDriver: true,
			}),
		]);
		animation.start();
		return () => animation.stop();
	}, [active, kind, reduceMotion, registrationOffset, state]);

	return (
		<View style={[styles.preview, withTopMargin && styles.previewTopMargin]}>
			{kind === "myPage" ? <FigmaMyPage state={state} /> : null}
			{kind === "registration" ? (
				<FigmaRegistration state={state} scrollOffset={registrationOffset} />
			) : null}
			{kind === "management" ? <FigmaManagement /> : null}
			{kind === "approval" ? <FigmaApproval state={state} /> : null}
		</View>
	);
};

const FigmaStatusBar = () => (
	<View style={styles.profileStatusBar}>
		<View style={styles.statusTimeSlot}>
			<Text allowFontScaling={false} style={styles.statusTime}>
				9:41
			</Text>
		</View>
		<View style={styles.dynamicIslandSpacer} />
		<View style={styles.statusLevels}>
			<Image
				source={page1StatusCellular}
				style={styles.statusCellular}
				resizeMode="contain"
			/>
			<Image
				source={page1StatusWifi}
				style={styles.statusWifi}
				resizeMode="contain"
			/>
			<Image
				source={page1StatusBattery}
				style={styles.statusBattery}
				resizeMode="contain"
			/>
		</View>
	</View>
);

const FigmaMyPage = ({ state }: { state: SceneState }) => (
	<LinearGradient
		colors={["#EBE2FF", "#D3BDFF"]}
		start={{ x: 0.5, y: 0 }}
		end={{ x: 0.5, y: 1 }}
		style={StyleSheet.absoluteFill}
	>
		<View style={styles.profilePhone}>
			<Image
				source={state === "third" ? page1Club : page1Profile}
				style={styles.profileAsset}
				resizeMode="stretch"
			/>
			{state !== "third" ? (
				<>
					<FigmaStatusBar />
					<View style={styles.profileTextMask} />
					<Text style={styles.profileNameOverlay}>김올클</Text>
					<Text style={styles.profileMajorOverlay}>공과대학 컴퓨터공학부</Text>
				</>
			) : null}
			<View pointerEvents="none" style={styles.profileBorder} />
		</View>
		{state === "second" ? (
			<>
				<View style={styles.calloutDim} />
				<Image
					source={page1Callout}
					style={styles.calloutAsset}
					resizeMode="stretch"
				/>
			</>
		) : null}
	</LinearGradient>
);

const FigmaRegistration = ({
	state,
	scrollOffset,
}: {
	state: SceneState;
	scrollOffset: Animated.Value;
}) => {
	if (state !== "third") {
		return (
			<Image
				source={state === "first" ? page2Step1 : page2Step2}
				style={styles.fullPreviewAsset}
				resizeMode="stretch"
			/>
		);
	}

	return (
		<Animated.View
			style={[
				styles.registrationLongFrame,
				{ transform: [{ translateY: scrollOffset }] },
			]}
		>
			<Image
				source={page2Registration}
				style={styles.registrationAsset}
				resizeMode="stretch"
			/>
			<View pointerEvents="none" style={styles.registrationRightBorder} />
		</Animated.View>
	);
};

const FigmaManagement = () => (
	<View style={styles.managementFrame}>
		<Image
			source={page3Management}
			style={styles.managementAsset}
			resizeMode="stretch"
		/>
		<View pointerEvents="none" style={styles.managementBorder} />
	</View>
);

const FigmaApproval = ({ state }: { state: SceneState }) => (
	<>
		<View style={styles.approvalFrame}>
			<Image
				source={page4Approval}
				style={styles.approvalAsset}
				resizeMode="stretch"
			/>
			<View pointerEvents="none" style={styles.approvalBorder} />
		</View>
		{state === "second" ? (
			<Image
				source={page4Confirmation}
				style={styles.approvalConfirmation}
				resizeMode="stretch"
			/>
		) : null}
	</>
);

export default ManagementGuideModal;

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "rgba(0, 0, 0, 0.5)",
	},
	blur: StyleSheet.absoluteFillObject,
	card: {
		width: s(342),
		height: vs(395),
		paddingTop: vs(20),
		paddingBottom: vs(25),
		borderRadius: ms(12),
		overflow: "hidden",
		backgroundColor: Colors.WHITE,
	},
	actions: {
		height: vs(28),
		paddingHorizontal: s(25),
		flexDirection: "row",
		justifyContent: "space-between",
	},
	actionsTopAligned: { alignItems: "flex-start" },
	actionsCentered: { alignItems: "center" },
	action: {
		height: vs(28),
		paddingHorizontal: s(13),
		borderRadius: ms(15),
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: Colors.BUTTON_SELECTED,
	},
	actionText: {
		...typography.bodySSmallSemibold,
		color: Colors.TEXT_BUTTON_SELECTED,
	},
	skip: {
		...typography.bodyMMedium13px,
		color: Colors.BODYTEXT_SUB_2,
		textDecorationLine: "underline",
	},
	skipTall: { lineHeight: vs(24) },
	skipCompact: { lineHeight: vs(16) },
	horizontal: {
		width: PAGE_WIDTH,
		height: vs(272),
		marginTop: vs(20),
		alignSelf: "center",
	},
	page: { width: PAGE_WIDTH, height: vs(272), alignItems: "center" },
	title: {
		...typography.headerL,
		height: vs(38),
		lineHeight: vs(19),
		color: Colors.BODYTEXT_MAIN,
		textAlign: "center",
	},
	dots: {
		height: ms(10),
		marginTop: vs(20),
		flexDirection: "row",
		justifyContent: "center",
		gap: s(7),
	},
	activeDot: {
		width: ms(10),
		height: ms(10),
		borderRadius: ms(5),
		backgroundColor: Colors.POINTCOLOR,
	},
	dot: {
		width: ms(10),
		height: ms(10),
		borderRadius: ms(5),
		backgroundColor: Colors.BACKGROUND_SUB,
	},
	stateOverlayMask: {
		width: PREVIEW_WIDTH,
		height: PREVIEW_HEIGHT,
		marginTop: vs(20),
		overflow: "hidden",
		borderRadius: ms(10),
		backgroundColor: "#FCFBFF",
	},
	incomingScene: {
		...StyleSheet.absoluteFillObject,
	},
	preview: {
		width: PREVIEW_WIDTH,
		height: PREVIEW_HEIGHT,
		overflow: "hidden",
		borderRadius: ms(10),
		backgroundColor: "#FCFBFF",
	},
	previewTopMargin: { marginTop: vs(20) },
	profilePhone: {
		position: "absolute",
		left: s(44),
		top: vs(33),
		width: s(178),
		height: vs(181),
		overflow: "hidden",
		borderTopLeftRadius: ms(20),
		borderTopRightRadius: ms(20),
	},
	profileAsset: {
		position: "absolute",
		left: s(3),
		top: vs(3),
		width: s(172),
		height: vs(373),
	},
	profileBorder: {
		...StyleSheet.absoluteFillObject,
		borderWidth: ms(3),
		borderBottomWidth: 0,
		borderColor: "#686868",
		borderTopLeftRadius: ms(20),
		borderTopRightRadius: ms(20),
	},
	profileStatusBar: {
		position: "absolute",
		left: 0,
		top: vs(10),
		width: s(178),
		height: vs(11),
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#F2F0F5",
		borderTopLeftRadius: ms(20),
		borderTopRightRadius: ms(20),
	},
	statusTimeSlot: {
		minWidth: 0,
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingLeft: s(7.303),
		paddingRight: s(2.738),
	},
	statusTime: {
		fontSize: ms(7.759),
		fontWeight: "600",
		lineHeight: vs(10.041),
		color: Colors.BLACK,
		includeFontPadding: false,
	},
	dynamicIslandSpacer: {
		width: s(56.595),
		height: vs(4.564),
	},
	statusLevels: {
		minWidth: 0,
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: s(3.195),
		paddingLeft: s(2.738),
		paddingRight: s(7.303),
	},
	statusCellular: {
		width: s(8.763),
		height: vs(5.58),
	},
	statusWifi: {
		width: s(7.824),
		height: vs(5.627),
	},
	statusBattery: {
		width: s(12.473),
		height: vs(5.933),
	},
	profileTextMask: {
		position: "absolute",
		left: s(16),
		top: vs(65),
		width: s(64),
		height: vs(23),
		backgroundColor: Colors.WHITE,
	},
	profileNameOverlay: {
		position: "absolute",
		left: s(18),
		top: vs(64),
		fontFamily: "Pretendard-Bold",
		fontSize: ms(9),
		lineHeight: vs(13.33),
		color: Colors.BODYTEXT_MAIN,
	},
	profileMajorOverlay: {
		position: "absolute",
		left: s(18),
		top: vs(77),
		fontFamily: "Pretendard-Regular",
		fontSize: ms(6.5),
		lineHeight: vs(13.33),
		color: Colors.BODYTEXT_SUB,
	},
	calloutDim: {
		position: "absolute",
		left: s(50),
		top: vs(142),
		width: s(166),
		height: vs(42),
		opacity: 0.5,
		backgroundColor: Colors.BACKGROUND_SUB,
	},
	calloutAsset: {
		position: "absolute",
		left: s(20),
		top: vs(127),
		width: s(227),
		height: vs(48.64),
		borderRadius: ms(7.78),
		shadowColor: "#391A79",
		shadowOffset: { width: 0, height: vs(4) },
		shadowOpacity: 0.2,
		shadowRadius: ms(10),
		elevation: 4,
	},
	fullPreviewAsset: { width: s(266), height: vs(214) },
	registrationLongFrame: {
		position: "absolute",
		left: s(20),
		top: -vs(26),
		width: s(226),
		height: REGISTRATION_IMAGE_HEIGHT,
		borderWidth: ms(3),
		borderColor: "#686868",
	},
	registrationAsset: {
		width: s(226),
		height: REGISTRATION_IMAGE_HEIGHT,
	},
	registrationRightBorder: {
		position: "absolute",
		top: 0,
		right: 0,
		bottom: 0,
		width: ms(3),
		backgroundColor: "#686868",
	},
	managementFrame: {
		position: "absolute",
		left: s(20),
		top: -vs(174),
		width: s(227),
		height: vs(491),
		shadowColor: Colors.BLACK,
		shadowOffset: { width: 0, height: vs(4) },
		shadowOpacity: 0.15,
		shadowRadius: ms(20),
		elevation: 4,
	},
	managementAsset: { width: s(227), height: vs(491) },
	managementBorder: {
		...StyleSheet.absoluteFillObject,
		borderWidth: ms(3),
		borderColor: "#686868",
	},
	approvalFrame: {
		position: "absolute",
		left: s(20),
		top: -vs(138),
		width: s(226),
		height: vs(489),
	},
	approvalAsset: { width: s(226), height: vs(489) },
	approvalBorder: {
		...StyleSheet.absoluteFillObject,
		borderWidth: ms(3),
		borderColor: "#696969",
	},
	approvalConfirmation: {
		position: "absolute",
		left: s(29),
		top: vs(51),
		width: s(208),
		height: vs(128),
		shadowColor: Colors.POINTCOLOR,
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.2,
		shadowRadius: ms(10),
		elevation: 4,
	},
});
