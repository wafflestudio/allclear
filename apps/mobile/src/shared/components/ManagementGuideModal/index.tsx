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
		{kind === "myPage" ? <FigmaMyPage state={state} /> : null}
		{kind === "registration" ? (
			<FigmaRegistration state={state} scrollOffset={offset} />
		) : null}
		{kind === "management" ? <FigmaManagement /> : null}
		{kind === "approval" ? <FigmaApproval state={state} /> : null}
	</View>
);

const PhoneChrome = ({ children }: { children: React.ReactNode }) => (
	<View style={styles.phoneChrome}>
		<View style={styles.phoneStatus}>
			<Text style={styles.time}>9:41</Text>
			<View style={styles.island} />
			<View style={styles.statusIcons}>
				<Icon name="signal-cellular-alt" size={ms(8)} color="#202020" />
				<Icon name="wifi" size={ms(8)} color="#202020" />
				<Icon name="battery-full" size={ms(9)} color="#202020" />
			</View>
		</View>
		<View style={styles.phoneBody}>{children}</View>
	</View>
);

const FigmaMyPage = ({ state }: { state: "first" | "second" | "third" }) => {
	if (state === "third") {
		return (
			<PhoneChrome>
				<View style={styles.navigationLine}>
					<Icon name="chevron-left" size={ms(13)} color="#757474" />
					<Text style={styles.navigationTitle}>동아리 관리</Text>
				</View>
				<View style={styles.clubHero} />
				<Text style={styles.clubName}>와플스튜디오</Text>
				<Text style={styles.clubDescription}>컴퓨터공학부</Text>
				<View style={styles.outlineAction}>
					<Text style={styles.outlineActionText}>동아리 신규등록 요청하기</Text>
				</View>
				<Text style={styles.smallSectionTitle}>공고 관리</Text>
				<View style={styles.emptyRow} />
			</PhoneChrome>
		);
	}
	return (
		<PhoneChrome>
			<View style={styles.profileCard}>
				<View style={styles.profileBadge}>
					<Text style={styles.profileBadgeText}>올</Text>
				</View>
				<Text style={styles.profileName}>김올클</Text>
				<Text style={styles.profileSub}>공과대학 컴퓨터공학부</Text>
				<Icon
					name="edit"
					size={ms(8)}
					color={Colors.POINTCOLOR}
					style={styles.profileEdit}
				/>
			</View>
			<View style={styles.managerPrompt}>
				<Text style={styles.managerPromptTitle}>동아리 운영진이신가요?</Text>
				<Text style={styles.managerPromptSub}>동아리 등록하기</Text>
				<Icon
					name="chevron-right"
					size={ms(12)}
					color={Colors.POINTCOLOR}
					style={styles.managerChevron}
				/>
			</View>
			<View style={styles.emptyManagerRow}>
				<Text style={styles.emptyManagerText}>계정연결 요청하기</Text>
			</View>
			{state === "second" && (
				<View style={styles.callout}>
					<Text style={styles.managerPromptTitle}>동아리 운영진이신가요?</Text>
					<Text style={styles.managerPromptSub}>동아리 등록하기</Text>
					<Icon
						name="chevron-right"
						size={ms(12)}
						color={Colors.POINTCOLOR}
						style={styles.managerChevron}
					/>
				</View>
			)}
		</PhoneChrome>
	);
};

const WidePhone = ({
	children,
	offset = 0,
}: {
	children: React.ReactNode;
	offset?: number;
}) => <View style={[styles.widePhone, { top: vs(offset) }]}>{children}</View>;

const FigmaRegistration = ({
	state,
	scrollOffset,
}: {
	state: "first" | "second" | "third";
	scrollOffset?: Animated.Value;
}) => {
	if (state === "third") {
		return (
			<WidePhone offset={-26}>
				<Animated.View
					style={{ transform: [{ translateY: scrollOffset ?? 0 }] }}
				>
					<RecruitmentStart />
					<View style={styles.timelineGap} />
					<RecruitmentEligibility />
					<View style={styles.timelineGap} />
					<RecruitmentFinish />
				</Animated.View>
			</WidePhone>
		);
	}
	const panel =
		state === "first" ? <RecruitmentStart /> : <RecruitmentEligibility />;
	return <WidePhone offset={state === "first" ? -26 : -640}>{panel}</WidePhone>;
};

const GuideInput = ({ label, wide }: { label: string; wide?: boolean }) => (
	<View style={[styles.guideInput, wide && styles.guideInputWide]}>
		<Text style={styles.guideInputText}>{label}</Text>
	</View>
);
const RecruitmentStart = () => (
	<View style={styles.formScreen}>
		<Text style={styles.formScreenTitle}>모집 공고를 작성해주세요</Text>
		<View style={styles.primaryChip}>
			<Text style={styles.primaryChipText}>이전 공고 불러오기</Text>
		</View>
		<Text style={styles.formScreenLabel}>*공고 제목</Text>
		<GuideInput label="텍스트를 입력하세요" wide />
		<Text style={styles.helperPurple}>공고 제목은 필수 입력 정보예요</Text>
		<Text style={styles.formScreenLabel}>*모집 기간</Text>
		<View style={styles.dateRow}>
			<GuideInput label="시작일" />
			<GuideInput label="마감일" />
		</View>
	</View>
);
const RecruitmentEligibility = () => (
	<View style={styles.formScreen}>
		<Text style={styles.formScreenLabel}>*지원 자격</Text>
		<View style={styles.choiceRow}>
			<View style={styles.choiceSelected}>
				<Text style={styles.choiceSelectedText}>제한 없음</Text>
			</View>
			<View style={styles.choice}>
				<Text style={styles.choiceText}>제한 있음</Text>
			</View>
		</View>
		<GuideInput label="지원 자격에 대해 설명해주세요" wide />
		<Text style={styles.helperPurple}>지원 자격은 필수 입력 정보예요</Text>
		<Text style={styles.formScreenLabel}>*모집 인원</Text>
		<View style={styles.choiceRow}>
			<View style={styles.choice}>
				<Text style={styles.choiceText}>제한 없음</Text>
			</View>
			<View style={styles.choiceSelected}>
				<Text style={styles.choiceSelectedText}>정원 있음</Text>
			</View>
		</View>
	</View>
);
const RecruitmentFinish = () => (
	<View style={styles.formScreen}>
		<Text style={styles.formScreenLabel}>기존 공고</Text>
		<GuideInput label="기존에 작성된 공고를 불러와주세요" wide />
		<Text style={styles.formScreenLabel}>공고 이미지</Text>
		<View style={styles.imageRow}>
			<View style={styles.imageThumb}>
				<Icon name="local-fire-department" size={ms(22)} color="#7A3D1E" />
			</View>
			<View style={styles.imageSelected}>
				<Text style={styles.primaryChipText}>삭제</Text>
			</View>
			<View style={styles.imageThumb}>
				<Icon name="add" size={ms(22)} color="#BCBCBC" />
			</View>
		</View>
		<View style={styles.footerRow}>
			<View style={styles.footerButton}>
				<Text style={styles.choiceText}>이전</Text>
			</View>
			<View style={styles.footerPrimary}>
				<Text style={styles.primaryChipText}>완료</Text>
			</View>
		</View>
	</View>
);
const FigmaManagement = () => (
	<WidePhone offset={-174}>
		<View style={styles.managementScreen}>
			<Text style={styles.managementHeading}>공고 관리</Text>
			<View style={styles.managementCreate}>
				<Text style={styles.managementCreateText}>새 공고 작성하기</Text>
				<Icon name="edit" size={ms(11)} color={Colors.POINTCOLOR} />
			</View>
			{["2026년 2월 공고", "2025년 7월 공고", "2025년 2월 공고"].map(
				(title, index) => (
					<View
						style={[styles.managementRow, index === 0 && styles.currentRow]}
						key={title}
					>
						<Text style={styles.managementRowText}>
							{index === 0 ? "현재 공고   " : ""}
							{title}
						</Text>
						<Icon name="edit" size={ms(9)} color="#C1C1C1" />
					</View>
				),
			)}
			<View style={styles.managementMore}>
				<Text style={styles.managementCreateText}>이전 공고 더보기</Text>
				<Icon name="expand-more" size={ms(12)} color="#BCBCBC" />
			</View>
		</View>
	</WidePhone>
);
const FigmaApproval = ({ state }: { state: "first" | "second" | "third" }) => (
	<WidePhone offset={-138}>
		<View style={styles.approvalScreen}>
			<View style={styles.approvalPrompt}>
				<Text style={styles.managerPromptTitle}>동아리 운영진이신가요?</Text>
				<Text style={styles.managerPromptSub}>동아리 등록하기</Text>
				<Icon
					name="chevron-right"
					size={ms(12)}
					color={Colors.POINTCOLOR}
					style={styles.managerChevron}
				/>
			</View>
			<View style={styles.approvalClubCard}>
				<View style={styles.clubLogo} />
				<View>
					<Text style={styles.approvalClubName}>와플스튜디오</Text>
					<Text style={styles.approvalClubSub}>
						컴퓨터공학부{`\n`}웹/앱 개발 동아리
					</Text>
				</View>
			</View>
			<View style={styles.approvalButtons}>
				<View style={styles.approvalButton}>
					<Text style={styles.choiceText}>운영진 권한 승인 대기</Text>
				</View>
				<View style={styles.approvalButton}>
					<Text style={styles.choiceText}>
						{state === "third" ? "승인 소요기간" : "동아리 관리 승인 대기"}
					</Text>
				</View>
			</View>
			<View style={styles.approvalEmpty}>
				<Text style={styles.emptyManagerText}>계정연결 요청하기</Text>
			</View>
		</View>
	</WidePhone>
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
	phoneChrome: {
		width: s(178),
		height: vs(181),
		overflow: "hidden",
		borderWidth: ms(3),
		borderBottomWidth: 0,
		borderColor: "#686868",
		borderTopLeftRadius: ms(20),
		borderTopRightRadius: ms(20),
		backgroundColor: "#F3F0F5",
	},
	phoneStatus: {
		height: vs(14),
		paddingHorizontal: s(8),
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		backgroundColor: "#F2F0F5",
	},
	phoneBody: { flex: 1, padding: s(10), backgroundColor: "#F3F0F5" },
	navigationLine: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		height: vs(14),
	},
	navigationTitle: {
		fontSize: ms(7),
		color: Colors.BODYTEXT_MAIN,
		fontWeight: "600",
	},
	clubHero: {
		height: vs(33),
		marginTop: vs(5),
		borderRadius: ms(4),
		backgroundColor: "#DDD9D3",
	},
	clubName: {
		marginTop: vs(6),
		fontSize: ms(8),
		fontWeight: "700",
		color: Colors.BODYTEXT_MAIN,
	},
	clubDescription: {
		marginTop: vs(2),
		fontSize: ms(5),
		color: Colors.BODYTEXT_SUB,
	},
	outlineAction: {
		height: vs(14),
		marginTop: vs(6),
		borderWidth: 1,
		borderRadius: ms(3),
		borderColor: Colors.POINTCOLOR,
		alignItems: "center",
		justifyContent: "center",
	},
	outlineActionText: { fontSize: ms(5), color: Colors.POINTCOLOR },
	smallSectionTitle: {
		marginTop: vs(8),
		fontSize: ms(5),
		color: Colors.BODYTEXT_SUB,
	},
	emptyRow: {
		height: vs(26),
		marginTop: vs(3),
		borderRadius: ms(4),
		backgroundColor: Colors.WHITE,
	},
	profileCard: {
		height: vs(58),
		padding: s(8),
		borderRadius: ms(5),
		backgroundColor: Colors.WHITE,
		position: "relative",
	},
	profileBadge: {
		width: ms(13),
		height: ms(13),
		borderRadius: ms(4),
		backgroundColor: "#E7E1D8",
		alignItems: "center",
		justifyContent: "center",
	},
	profileBadgeText: { fontSize: ms(6), fontWeight: "700", color: "#8E8679" },
	profileEdit: { position: "absolute", top: vs(8), right: s(8) },
	managerPrompt: {
		height: vs(31),
		marginTop: vs(6),
		paddingHorizontal: s(8),
		paddingVertical: vs(6),
		borderRadius: ms(5),
		backgroundColor: Colors.WHITE,
		position: "relative",
	},
	managerPromptTitle: {
		fontSize: ms(6),
		color: Colors.POINTCOLOR,
		fontWeight: "600",
	},
	managerPromptSub: { marginTop: vs(2), fontSize: ms(5), color: "#BFA4FF" },
	managerChevron: { position: "absolute", right: s(7), top: vs(10) },
	emptyManagerRow: {
		height: vs(23),
		marginTop: vs(6),
		paddingHorizontal: s(8),
		borderRadius: ms(5),
		backgroundColor: Colors.WHITE,
		justifyContent: "center",
	},
	emptyManagerText: { fontSize: ms(5), color: Colors.BODYTEXT_SUB },
	callout: {
		position: "absolute",
		left: -s(24),
		top: vs(48),
		width: s(227),
		height: vs(49),
		paddingHorizontal: s(12),
		paddingVertical: vs(11),
		borderRadius: ms(8),
		backgroundColor: Colors.WHITE,
		shadowColor: "#391A79",
		shadowOpacity: 0.2,
		shadowRadius: ms(10),
		elevation: 4,
	},
	widePhone: {
		position: "absolute",
		left: s(20),
		width: s(227),
		height: vs(490),
		overflow: "hidden",
		borderWidth: ms(3),
		borderColor: "#686868",
		borderRadius: ms(1),
		backgroundColor: "#FCFBFF",
	},
	formScreen: {
		paddingHorizontal: s(28),
		paddingTop: vs(34),
		minHeight: vs(420),
		backgroundColor: "#FCFBFF",
	},
	timelineGap: { height: vs(280), backgroundColor: "#FCFBFF" },
	formScreenTitle: { fontSize: ms(14), fontWeight: "700", color: "#686868" },
	primaryChip: {
		alignSelf: "flex-start",
		marginTop: vs(11),
		paddingHorizontal: s(8),
		paddingVertical: vs(5),
		borderRadius: ms(4),
		backgroundColor: Colors.POINTCOLOR,
	},
	primaryChipText: { fontSize: ms(6), color: Colors.WHITE, fontWeight: "600" },
	formScreenLabel: {
		marginTop: vs(13),
		fontSize: ms(9),
		color: "#686868",
		fontWeight: "600",
	},
	guideInput: {
		height: vs(32),
		minWidth: s(76),
		marginTop: vs(5),
		paddingHorizontal: s(8),
		borderWidth: 1,
		borderColor: "#D7D3DC",
		borderRadius: ms(4),
		justifyContent: "center",
	},
	guideInputWide: { width: "100%" },
	guideInputText: { fontSize: ms(6), color: "#BCBCBC" },
	helperPurple: { marginTop: vs(5), fontSize: ms(6), color: Colors.POINTCOLOR },
	dateRow: { flexDirection: "row", gap: s(6) },
	choiceRow: { flexDirection: "row", gap: s(7), marginTop: vs(5) },
	choice: {
		flex: 1,
		height: vs(30),
		borderWidth: 1,
		borderColor: "#D7D3DC",
		borderRadius: ms(4),
		justifyContent: "center",
		alignItems: "center",
	},
	choiceSelected: {
		flex: 1,
		height: vs(30),
		borderRadius: ms(4),
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: Colors.POINTCOLOR,
	},
	choiceText: { fontSize: ms(6), color: "#BCBCBC" },
	choiceSelectedText: {
		fontSize: ms(6),
		color: Colors.WHITE,
		fontWeight: "600",
	},
	imageRow: { flexDirection: "row", gap: s(7), marginTop: vs(7) },
	imageThumb: {
		width: s(55),
		height: vs(55),
		borderWidth: 1,
		borderColor: "#D7D3DC",
		borderRadius: ms(4),
		alignItems: "center",
		justifyContent: "center",
	},
	imageSelected: {
		width: s(55),
		height: vs(55),
		borderRadius: ms(4),
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#BCBCBC",
	},
	footerRow: { flexDirection: "row", gap: s(7), marginTop: vs(16) },
	footerButton: {
		flex: 1,
		height: vs(27),
		borderWidth: 1,
		borderColor: "#D7D3DC",
		borderRadius: ms(4),
		justifyContent: "center",
		alignItems: "center",
	},
	footerPrimary: {
		flex: 1,
		height: vs(27),
		borderRadius: ms(4),
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: Colors.POINTCOLOR,
	},
	managementScreen: {
		paddingHorizontal: s(30),
		paddingTop: vs(181),
		minHeight: vs(490),
		backgroundColor: "#FCFBFF",
	},
	managementHeading: {
		marginBottom: vs(12),
		fontSize: ms(7),
		color: "#757474",
	},
	managementCreate: {
		height: vs(23),
		paddingHorizontal: s(10),
		borderWidth: 1,
		borderColor: Colors.POINTCOLOR,
		borderRadius: ms(5),
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	managementCreateText: { fontSize: ms(6), color: Colors.POINTCOLOR },
	managementRow: {
		height: vs(23),
		marginTop: vs(5),
		paddingHorizontal: s(10),
		borderRadius: ms(5),
		backgroundColor: Colors.WHITE,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	currentRow: { backgroundColor: "#F3F0F5" },
	managementRowText: { fontSize: ms(6), color: "#757474" },
	managementMore: {
		height: vs(23),
		marginTop: vs(5),
		paddingHorizontal: s(10),
		borderRadius: ms(5),
		backgroundColor: "#F3F0F5",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	approvalScreen: {
		paddingHorizontal: s(28),
		paddingTop: vs(154),
		minHeight: vs(489),
		backgroundColor: "#FCFBFF",
	},
	approvalPrompt: {
		height: vs(36),
		paddingHorizontal: s(10),
		paddingVertical: vs(8),
		borderRadius: ms(5),
		backgroundColor: Colors.WHITE,
		position: "relative",
	},
	approvalClubCard: {
		marginTop: vs(10),
		padding: s(10),
		height: vs(62),
		borderRadius: ms(7),
		backgroundColor: Colors.WHITE,
		flexDirection: "row",
		alignItems: "center",
		gap: s(8),
	},
	clubLogo: {
		width: ms(38),
		height: ms(38),
		borderRadius: ms(5),
		backgroundColor: "#D9D9D9",
	},
	approvalClubName: {
		fontSize: ms(8),
		fontWeight: "700",
		color: Colors.BODYTEXT_MAIN,
	},
	approvalClubSub: {
		marginTop: vs(3),
		fontSize: ms(5),
		color: Colors.BODYTEXT_SUB,
		lineHeight: ms(7),
	},
	approvalButtons: { flexDirection: "row", gap: s(6), marginTop: vs(7) },
	approvalButton: {
		flex: 1,
		height: vs(20),
		borderWidth: 1,
		borderColor: "#D7D3DC",
		borderRadius: ms(4),
		alignItems: "center",
		justifyContent: "center",
	},
	approvalEmpty: {
		height: vs(25),
		marginTop: vs(10),
		paddingHorizontal: s(8),
		borderRadius: ms(5),
		backgroundColor: Colors.WHITE,
		justifyContent: "center",
	},
});
