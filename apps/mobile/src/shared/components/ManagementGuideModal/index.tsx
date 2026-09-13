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
			<Preview kind="manage" />
		) : (
			<VerticalStates
				kind={
					item.id === "clubRegistration"
						? "club"
						: item.id === "announcementRegistration"
							? "announcement"
							: "approval"
				}
			/>
		)}
	</View>
);
const VerticalStates = ({
	kind,
}: {
	kind: "club" | "announcement" | "approval";
}) => (
	<ScrollView
		pagingEnabled
		nestedScrollEnabled
		showsVerticalScrollIndicator={false}
		style={styles.vertical}
	>
		{["first", "second", "third"].map((state) => (
			<State key={state} kind={kind} state={state} />
		))}
	</ScrollView>
);
const State = ({
	kind,
	state,
}: {
	kind: "club" | "announcement" | "approval";
	state: string;
}) => {
	const offset = useRef(new Animated.Value(-vs(9))).current;
	useEffect(() => {
		if (kind !== "announcement" || state !== "third") return;
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
	if (kind === "approval") return <Preview kind="approval" state={state} />;
	return <Preview kind={kind} state={state} offset={offset} />;
};
const Preview = ({
	kind,
	state = "first",
	offset,
}: {
	kind: "club" | "announcement" | "manage" | "approval";
	state?: string;
	offset?: Animated.Value;
}) => (
	<View
		style={[
			styles.preview,
			kind === "club" ? styles.clubSurface : styles.whiteSurface,
		]}
	>
		<Phone>
			<Animated.View
				style={
					kind === "announcement" && state === "third"
						? { transform: [{ translateY: offset ?? 0 }] }
						: undefined
				}
			>
				<Text style={styles.phoneTitle}>
					{kind === "club"
						? "마이페이지"
						: kind === "approval"
							? "동아리 등록"
							: "동아리 관리"}
				</Text>
				{kind === "approval" ? (
					<View style={[styles.approval, state === "third" && styles.selected]}>
						<Icon
							name={state === "first" ? "assignment" : "verified"}
							size={ms(34)}
							color={Colors.POINTCOLOR}
						/>
						<Text style={styles.name}>
							{state === "first" ? "운영진 권한 요청" : "승인 대기 중"}
						</Text>
						<Text style={styles.sub}>
							{state === "third"
								? "최대 일주일 정도 소요될 수 있어요"
								: "운영진 확인 후 알려드릴게요"}
						</Text>
					</View>
				) : (
					<>
						<View style={styles.avatar} />
						<Text style={styles.name}>
							{kind === "club" ? "김올클" : "올클 동아리"}
						</Text>
						<Text style={styles.sub}>
							{kind === "club" ? "공과대학 컴퓨터공학부" : "공고 관리"}
						</Text>
						<View style={[styles.focus, state === "second" && styles.selected]}>
							<Text style={styles.focusText}>
								{kind === "club"
									? "동아리 운영진이신가요?"
									: kind === "manage"
										? "이전 공고 더보기"
										: "새 공고 작성하기"}
							</Text>
							<Icon
								name={
									kind === "club"
										? "chevron-right"
										: kind === "manage"
											? "expand-more"
											: "edit"
								}
								size={ms(12)}
								color={Colors.POINTCOLOR}
							/>
						</View>
						{(kind === "announcement" && state !== "first") ||
						(kind === "club" && state === "third") ? (
							<Fields />
						) : null}
					</>
				)}
			</Animated.View>
		</Phone>
	</View>
);
const Fields = () => (
	<View style={styles.fields}>
		{["모집 공고 제목", "모집 기간", "모집 대상", "상세 내용", "문의 방법"].map(
			(label) => (
				<View key={label}>
					<Text style={styles.fieldLabel}>{label}</Text>
					<View style={styles.input} />
				</View>
			),
		)}
	</View>
);
const Phone = ({ children }: { children: React.ReactNode }) => (
	<View style={styles.phone}>
		<View style={styles.status}>
			<Text style={styles.time}>9:41</Text>
			<View style={styles.island} />
			<View style={styles.signal} />
		</View>
		<View style={styles.phoneBody}>{children}</View>
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
		gap: s(4),
		marginTop: vs(20),
	},
	activeDot: {
		width: s(25),
		height: vs(3),
		borderRadius: 2,
		backgroundColor: Colors.POINTCOLOR,
	},
	dot: {
		width: s(8),
		height: vs(3),
		borderRadius: 2,
		backgroundColor: "#D9D9D9",
	},
	vertical: { width: s(266), height: vs(214), marginTop: vs(20) },
	preview: {
		width: s(266),
		height: vs(214),
		overflow: "hidden",
		alignItems: "center",
		justifyContent: "flex-end",
		borderRadius: ms(10),
	},
	clubSurface: { backgroundColor: "#E2D1FF" },
	whiteSurface: { backgroundColor: "#FCFBFF" },
	phone: {
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
	status: {
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
	signal: {
		width: s(12),
		height: vs(5),
		borderRadius: 2,
		backgroundColor: Colors.BODYTEXT_MAIN,
	},
	phoneBody: {
		flex: 1,
		padding: s(10),
		backgroundColor: Colors.BACKGROUND_MAIN,
	},
	phoneTitle: {
		fontSize: ms(8),
		fontWeight: "600",
		color: Colors.BODYTEXT_SUB,
	},
	avatar: {
		width: ms(22),
		height: ms(22),
		marginTop: vs(10),
		borderRadius: ms(5),
		backgroundColor: "#D9D9D9",
	},
	name: {
		marginTop: vs(5),
		fontSize: ms(8),
		fontWeight: "700",
		color: Colors.BODYTEXT_MAIN,
		textAlign: "center",
	},
	sub: {
		marginTop: vs(3),
		fontSize: ms(6),
		color: Colors.BODYTEXT_SUB,
		textAlign: "center",
	},
	focus: {
		minHeight: vs(29),
		marginTop: vs(14),
		padding: s(7),
		borderRadius: ms(6),
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		backgroundColor: Colors.WHITE,
	},
	selected: {
		borderWidth: 1,
		borderColor: Colors.POINTCOLOR,
		shadowColor: Colors.POINTCOLOR,
		shadowOpacity: 0.2,
		shadowRadius: ms(8),
		elevation: 2,
	},
	focusText: {
		fontSize: ms(6),
		fontWeight: "600",
		color: Colors.BODYTEXT_MAIN,
	},
	fields: { marginTop: vs(15), gap: vs(8) },
	fieldLabel: { fontSize: ms(6), color: Colors.BODYTEXT_SUB },
	input: {
		height: vs(20),
		marginTop: vs(3),
		borderWidth: 1,
		borderColor: Colors.BODYTEXT_DISABLED,
		borderRadius: ms(4),
	},
	approval: {
		marginTop: vs(35),
		paddingVertical: vs(18),
		borderRadius: ms(9),
		alignItems: "center",
		backgroundColor: Colors.WHITE,
	},
});
