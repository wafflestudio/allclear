import { BlurView } from "@react-native-community/blur";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	Animated,
	Modal,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { NewAnnouncementAction } from "@/features/club/components/NewAnnouncementAction";
import { ManagerRegistrationCard } from "@/features/mypage/components/ManagerRegistrationCard";
import TextField from "@/shared/components/TextField";
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
const pages = [
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
] as const;
const width = s(292);

const ManagementGuideModal = ({ visible, type, onStart, onSkip }: Props) => {
	const entrance = useRef(new Animated.Value(0)).current;
	const pager = useRef<ScrollView>(null);
	const [page, setPage] = useState(0);
	const initial = useMemo(
		() => pages.findIndex((item) => item.id === type),
		[type],
	);
	useEffect(() => {
		if (!visible) {
			entrance.setValue(0);
			return;
		}
		setPage(initial);
		requestAnimationFrame(() =>
			pager.current?.scrollTo({ x: initial * width, animated: false }),
		);
		Animated.spring(entrance, {
			toValue: 1,
			friction: 8,
			tension: 70,
			useNativeDriver: true,
		}).start();
	}, [entrance, initial, visible]);
	return (
		<Modal
			transparent
			visible={visible}
			animationType="fade"
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
					<View style={styles.actions}>
						<TouchableOpacity style={styles.action} onPress={onStart}>
							<Text style={styles.actionText}>{pages[page]?.action}</Text>
						</TouchableOpacity>
						<TouchableOpacity onPress={onSkip}>
							<Text style={styles.skip}>건너뛰기</Text>
						</TouchableOpacity>
					</View>
					<ScrollView
						ref={pager}
						horizontal
						pagingEnabled
						showsHorizontalScrollIndicator={false}
						decelerationRate="fast"
						style={styles.horizontal}
						onMomentumScrollEnd={(event) =>
							setPage(Math.round(event.nativeEvent.contentOffset.x / width))
						}
					>
						{pages.map((item) => (
							<GuidePage key={item.id} item={item} />
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

const GuidePage = ({ item }: { item: (typeof pages)[number] }) => (
	<View style={styles.page}>
		<Text style={styles.title}>{item.title}</Text>
		{item.id === "announcementManagement" ? (
			<GuideScene kind="management" state="first" />
		) : (
			<VerticalStates
				kind={
					item.id === "clubRegistration"
						? "myPage"
						: item.id === "announcementRegistration"
							? "registration"
							: "approval"
				}
			/>
		)}
	</View>
);
const VerticalStates = ({
	kind,
}: {
	kind: "myPage" | "registration" | "approval";
}) => (
	<ScrollView
		pagingEnabled
		nestedScrollEnabled
		showsVerticalScrollIndicator={false}
		style={styles.vertical}
	>
		{(["first", "second", "third"] as const).map((state) => (
			<State key={state} kind={kind} state={state} />
		))}
	</ScrollView>
);
const State = ({
	kind,
	state,
}: {
	kind: "myPage" | "registration" | "approval";
	state: "first" | "second" | "third";
}) => {
	const offset = useRef(new Animated.Value(-vs(9))).current;
	useEffect(() => {
		if (kind !== "registration" || state !== "third") return;
		const loop = Animated.loop(
			Animated.sequence([
				Animated.timing(offset, {
					toValue: -vs(133),
					duration: 1919,
					useNativeDriver: true,
				}),
				Animated.timing(offset, {
					toValue: -vs(830),
					duration: 2020,
					useNativeDriver: true,
				}),
				Animated.timing(offset, {
					toValue: -vs(1026),
					duration: 1810,
					useNativeDriver: true,
				}),
				Animated.delay(2222),
			]),
		);
		loop.start();
		return () => loop.stop();
	}, [kind, offset, state]);
	return <GuideScene kind={kind} state={state} offset={offset} />;
};
type SceneKind = "myPage" | "registration" | "management" | "approval";

const GuideScene = ({
	kind,
	state,
	offset,
}: {
	kind: SceneKind;
	state: "first" | "second" | "third";
	offset?: Animated.Value;
}) => (
	<View style={[styles.preview, kind === "myPage" && styles.clubSurface]}>
		<GuideDevice>
			{kind === "myPage" && <GuideMyPage state={state} />}
			{kind === "registration" && (
				<GuideRegistration state={state} offset={offset} />
			)}
			{kind === "management" && <GuideManagement />}
			{kind === "approval" && <GuideApproval state={state} />}
		</GuideDevice>
	</View>
);

const GuideDevice = ({ children }: { children: React.ReactNode }) => (
	<View style={styles.device}>
		<View style={styles.statusBar}>
			<Text style={styles.time}>9:41</Text>
			<View style={styles.island} />
			<View style={styles.statusIcons}>
				<Icon name="signal-cellular-alt" size={ms(8)} color="#202020" />
				<Icon name="wifi" size={ms(8)} color="#202020" />
				<Icon name="battery-full" size={ms(9)} color="#202020" />
			</View>
		</View>
		<View style={styles.deviceBody}>{children}</View>
	</View>
);

const GuideMyPage = ({ state }: { state: "first" | "second" | "third" }) => (
	<View>
		<Text style={styles.screenHeading}>마이페이지</Text>
		<View style={styles.profileRow}>
			<View style={styles.avatar} />
			<View>
				<Text style={styles.profileName}>김올클</Text>
				<Text style={styles.profileSub}>공과대학 컴퓨터공학부</Text>
			</View>
		</View>
		<View style={styles.miniCardWrap}>
			<ManagerRegistrationCard />
		</View>
		{state !== "first" && <View style={styles.guideDim} />}
		{state === "third" && <View style={styles.guideFocus} />}
	</View>
);

const GuideRegistration = ({
	state,
	offset,
}: {
	state: "first" | "second" | "third";
	offset?: Animated.Value;
}) => (
	<Animated.View
		style={
			state === "third"
				? { transform: [{ translateY: offset ?? 0 }] }
				: undefined
		}
	>
		<Text style={styles.screenHeading}>공고 등록</Text>
		<Text style={styles.screenTitle}>새로운 공고를 등록해 주세요</Text>
		<View style={styles.formFields}>
			{["공고 제목", "모집 기간", "모집 대상", "상세 내용", "문의 방법"].map(
				(label, index) => (
					<View key={label}>
						<Text style={styles.formLabel}>{label}</Text>
						<TextField
							height={24}
							editable={false}
							placeholder={index === 0 ? "공고 제목을 입력해 주세요" : "입력"}
							style={styles.formInput}
						/>
					</View>
				),
			)}
		</View>
		{state !== "first" && <View style={styles.registrationFocus} />}
	</Animated.View>
);

const GuideManagement = () => (
	<View>
		<Text style={styles.screenHeading}>동아리 관리</Text>
		<Text style={styles.managementLabel}>공고 관리</Text>
		<NewAnnouncementAction />
		<View style={styles.announcementRow}>
			<Text style={styles.announcementText}>2026년 하반기 신입 부원 모집</Text>
			<Icon name="edit" size={ms(11)} color="#C1C1C1" />
		</View>
		<View style={[styles.announcementRow, styles.previousRow]}>
			<Text style={styles.previousText}>이전 공고 더보기</Text>
			<Icon name="expand-more" size={ms(13)} color={Colors.POINTCOLOR} />
		</View>
	</View>
);

const GuideApproval = ({ state }: { state: "first" | "second" | "third" }) => (
	<View>
		<Text style={styles.screenHeading}>동아리 등록</Text>
		<Text style={styles.screenTitle}>운영진 기본 정보를{`\n`}입력해주세요</Text>
		<View style={styles.approvalForm}>
			<Text style={styles.formLabel}>이름</Text>
			<TextField
				height={24}
				editable={false}
				placeholder="홍길동"
				style={styles.formInput}
			/>
			<Text style={styles.formLabel}>전화번호</Text>
			<TextField
				height={24}
				editable={false}
				placeholder="010-1234-5678"
				style={styles.formInput}
			/>
		</View>
		<View
			style={[
				styles.approvalNotice,
				state === "third" && styles.noticeSelected,
			]}
		>
			<Icon
				name={state === "first" ? "assignment" : "schedule"}
				size={ms(15)}
				color={Colors.POINTCOLOR}
			/>
			<View style={styles.noticeCopy}>
				<Text style={styles.noticeTitle}>승인 대기 중</Text>
				<Text style={styles.noticeSub}>최대 일주일 정도 소요될 수 있어요</Text>
			</View>
		</View>
	</View>
);
export default ManagementGuideModal;
const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "rgba(0,0,0,0.5)",
	},
	blur: { ...StyleSheet.absoluteFillObject },
	card: {
		width: s(342),
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
		alignItems: "center",
	},
	action: {
		paddingHorizontal: s(13),
		paddingVertical: vs(7),
		borderRadius: ms(15),
		backgroundColor: Colors.POINTCOLOR,
	},
	actionText: { ...typography.bodySSmallSemibold, color: Colors.WHITE },
	skip: {
		...typography.bodyMMedium13px,
		color: Colors.BODYTEXT_SUB_2,
		textDecorationLine: "underline",
	},
	horizontal: { width, marginTop: vs(20), alignSelf: "center" },
	page: { width, alignItems: "center" },
	title: {
		...typography.headerL,
		lineHeight: ms(22),
		color: Colors.BODYTEXT_MAIN,
		textAlign: "center",
	},
	dots: {
		flexDirection: "row",
		justifyContent: "center",
		gap: s(6),
		marginTop: vs(20),
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
		backgroundColor: "#E9E6EF",
	},
	vertical: { width: s(266), height: vs(214), marginTop: vs(20) },
	preview: {
		width: s(266),
		height: vs(214),
		overflow: "hidden",
		alignItems: "center",
		justifyContent: "flex-end",
		borderRadius: ms(10),
		backgroundColor: "#FCFBFF",
	},
	clubSurface: { backgroundColor: "#E2D1FF" },
	device: {
		width: s(178),
		height: vs(181),
		overflow: "hidden",
		borderWidth: ms(3),
		borderBottomWidth: 0,
		borderColor: "#686868",
		borderTopLeftRadius: ms(20),
		borderTopRightRadius: ms(20),
		backgroundColor: Colors.BACKGROUND_MAIN,
	},
	statusBar: {
		height: vs(14),
		paddingHorizontal: s(8),
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		backgroundColor: "#F2F0F5",
	},
	time: { fontSize: ms(7), fontWeight: "600", color: Colors.BODYTEXT_MAIN },
	island: {
		width: s(57),
		height: vs(5),
		borderRadius: 4,
		backgroundColor: Colors.BODYTEXT_MAIN,
	},
	statusIcons: {
		flexDirection: "row",
		alignItems: "center",
		gap: s(2),
	},
	deviceBody: {
		flex: 1,
		padding: s(10),
		backgroundColor: Colors.BACKGROUND_MAIN,
	},
	screenHeading: {
		fontSize: ms(8),
		fontWeight: "600",
		color: Colors.BODYTEXT_SUB,
	},
	profileRow: {
		marginTop: vs(10),
		flexDirection: "row",
		alignItems: "center",
		gap: s(6),
	},
	avatar: {
		width: ms(24),
		height: ms(24),
		borderRadius: ms(12),
		backgroundColor: "#D9D9D9",
	},
	profileName: {
		fontSize: ms(8),
		fontWeight: "700",
		color: Colors.BODYTEXT_MAIN,
	},
	profileSub: {
		marginTop: vs(2),
		fontSize: ms(6),
		color: Colors.BODYTEXT_SUB,
	},
	miniCardWrap: {
		marginTop: vs(12),
		width: s(227),
		transform: [{ scale: 0.65 }],
		transformOrigin: "top left",
	},
	guideDim: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "rgba(242,240,245,0.5)",
	},
	guideFocus: {
		position: "absolute",
		top: vs(48),
		left: -s(1),
		width: s(158),
		height: vs(52),
		borderRadius: ms(8),
		borderWidth: 1,
		borderColor: Colors.POINTCOLOR,
		shadowColor: Colors.POINTCOLOR,
		shadowOpacity: 0.2,
		shadowRadius: ms(8),
		elevation: 2,
	},
	screenTitle: {
		marginTop: vs(14),
		fontSize: ms(11),
		lineHeight: ms(15),
		fontWeight: "700",
		color: Colors.BODYTEXT_MAIN,
	},
	formFields: { marginTop: vs(12), gap: vs(7) },
	formLabel: {
		fontSize: ms(6),
		color: Colors.BODYTEXT_SUB,
	},
	formInput: {
		marginTop: vs(2),
		paddingHorizontal: s(7),
		fontSize: ms(6),
		borderRadius: ms(5),
	},
	registrationFocus: {
		position: "absolute",
		top: vs(46),
		left: -s(2),
		width: s(158),
		height: vs(38),
		borderWidth: 1,
		borderRadius: ms(7),
		borderColor: Colors.POINTCOLOR,
	},
	managementLabel: {
		marginTop: vs(13),
		marginBottom: vs(5),
		fontSize: ms(7),
		color: Colors.BODYTEXT_SUB,
	},
	announcementRow: {
		minHeight: vs(27),
		marginTop: vs(6),
		paddingHorizontal: s(8),
		borderRadius: ms(7),
		backgroundColor: Colors.WHITE,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	announcementText: { fontSize: ms(6), color: Colors.BODYTEXT_SUB },
	previousRow: { backgroundColor: "#F3F0F5" },
	previousText: { fontSize: ms(6), color: Colors.POINTCOLOR },
	approvalForm: { marginTop: vs(10), gap: vs(4) },
	approvalNotice: {
		marginTop: vs(12),
		padding: s(8),
		borderRadius: ms(8),
		flexDirection: "row",
		alignItems: "center",
		gap: s(6),
		backgroundColor: Colors.WHITE,
	},
	noticeSelected: { borderWidth: 1, borderColor: Colors.POINTCOLOR },
	noticeCopy: { flexShrink: 1 },
	noticeTitle: {
		fontSize: ms(7),
		fontWeight: "700",
		color: Colors.BODYTEXT_MAIN,
	},
	noticeSub: { marginTop: vs(2), fontSize: ms(5), color: Colors.BODYTEXT_SUB },
});
