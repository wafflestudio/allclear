import { useEffect, useRef } from "react";
import {
	Animated,
	Modal,
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

type Props = { visible: boolean; type: GuideType; onStart: () => void; onSkip: () => void };

const content: Record<GuideType, { button: string; title: string }> = {
	clubRegistration: { button: "동아리 등록하기", title: "운영하고 있는 동아리가 있다면\n올클에 등록해주세요!" },
	announcementRegistration: { button: "공고 등록하기", title: "신규 부원 모집을 위한\n공고를 손쉽게 등록할 수 있어요!" },
	announcementManagement: { button: "공고 관리하기", title: "공고관리에서\n지난 공고들도 수정하고 관리해요" },
	approvalTime: { button: "승인 소요기간", title: "동아리 신규 등록 및 운영진 승인은\n최대 일주일 정도 소요될 수 있어요" },
};

const ManagementGuideModal = ({ visible, type, onStart, onSkip }: Props) => {
	const entrance = useRef(new Animated.Value(0)).current;
	useEffect(() => {
		if (!visible) { entrance.setValue(0); return; }
		Animated.spring(entrance, { toValue: 1, useNativeDriver: true, friction: 8, tension: 70 }).start();
	}, [entrance, visible]);
	const item = content[type];
	return <Modal transparent visible={visible} animationType="fade" onRequestClose={onSkip}>
		<View style={styles.overlay}>
			<Animated.View style={[styles.card, { opacity: entrance, transform: [{ scale: entrance.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }] }]}>
				<View style={styles.actions}><TouchableOpacity style={styles.button} onPress={onStart}><Text style={styles.buttonText}>{item.button}</Text></TouchableOpacity><TouchableOpacity onPress={onSkip}><Text style={styles.skip}>건너뛰기</Text></TouchableOpacity></View>
				<View style={styles.body}><Text style={styles.title}>{item.title}</Text><GuidePreview type={type} /><View style={styles.dots}><View style={styles.activeDot} /><View style={styles.dot} /><View style={styles.dot} /></View></View>
			</Animated.View>
		</View>
	</Modal>;
};

const GuidePreview = ({ type }: { type: GuideType }) => {
	const offset = useRef(new Animated.Value(-vs(9))).current;
	useEffect(() => {
		if (type !== "announcementRegistration") return;
		const animation = Animated.loop(Animated.sequence([
			Animated.timing(offset, { toValue: -vs(133), duration: 1919, useNativeDriver: true }),
			Animated.timing(offset, { toValue: -vs(830), duration: 2020, useNativeDriver: true }),
			Animated.timing(offset, { toValue: -vs(1026), duration: 1810, useNativeDriver: true }), Animated.delay(2222),
		])); animation.start(); return () => animation.stop();
	}, [offset, type]);
	if (type === "approvalTime") return <View style={styles.preview}><View style={styles.approval}><Icon name="verified" color={Colors.POINTCOLOR} size={ms(35)} /><Text style={styles.previewTitle}>승인 대기 중</Text><Text style={styles.previewSub}>운영진 확인 후 알려드릴게요</Text></View></View>;
	return <View style={styles.preview}><View style={styles.phone}><Animated.View style={[styles.phoneContent, type === "announcementRegistration" && { transform: [{ translateY: offset }] }]}>
		<Text style={styles.phoneHeader}>{type === "clubRegistration" ? "마이페이지" : "동아리 관리"}</Text>
		<View style={styles.profile} /><Text style={styles.previewTitle}>{type === "clubRegistration" ? "김올클" : "올클 동아리"}</Text><Text style={styles.previewSub}>{type === "clubRegistration" ? "공과대학 컴퓨터공학부" : "공고 관리"}</Text>
		<View style={styles.previewCard}><Text style={styles.previewTitle}>{type === "clubRegistration" ? "동아리 운영진이신가요?" : "새 공고 작성하기"}</Text><Icon name={type === "clubRegistration" ? "chevron-right" : "edit"} size={ms(12)} color={Colors.POINTCOLOR} /></View>
		{type === "announcementRegistration" && ["모집 공고 제목", "모집 기간", "모집 대상", "상세 내용", "문의 방법"].map((label) => <View key={label} style={styles.field}><Text style={styles.previewSub}>{label}</Text><View style={styles.input} /></View>)}
	</Animated.View></View></View>;
};

export default ManagementGuideModal;

const styles = StyleSheet.create({
	overlay: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)" },
	card: { width: s(342), borderRadius: ms(12), padding: s(25), backgroundColor: Colors.WHITE },
	actions: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: s(20) }, button: { borderRadius: ms(15), paddingHorizontal: s(13), paddingVertical: vs(7), backgroundColor: Colors.POINTCOLOR }, buttonText: { ...typography.bodySSmallSemibold, color: Colors.WHITE }, skip: { ...typography.bodyMMedium13px, color: Colors.BODYTEXT_SUB_2, textDecorationLine: "underline" },
	body: { alignItems: "center", marginTop: vs(20) }, title: { ...typography.headerL, lineHeight: ms(22), color: Colors.BODYTEXT_MAIN, textAlign: "center" },
	preview: { width: s(266), height: vs(214), marginTop: vs(20), alignItems: "center", justifyContent: "flex-end", overflow: "hidden", borderRadius: ms(10), backgroundColor: "#E2D1FF" },
	phone: { width: s(178), height: vs(181), overflow: "hidden", borderWidth: ms(3), borderBottomWidth: 0, borderColor: "#686868", borderTopLeftRadius: ms(20), borderTopRightRadius: ms(20), backgroundColor: Colors.BACKGROUND_MAIN }, phoneContent: { minHeight: vs(1200), padding: s(10) }, phoneHeader: { fontSize: ms(8), fontWeight: "600", color: Colors.BODYTEXT_SUB }, profile: { width: ms(23), height: ms(23), marginTop: vs(12), borderRadius: ms(6), backgroundColor: "#D9D9D9" }, previewTitle: { marginTop: vs(6), fontSize: ms(8), fontWeight: "600", color: Colors.BODYTEXT_MAIN }, previewSub: { marginTop: vs(3), fontSize: ms(6), color: Colors.BODYTEXT_SUB }, previewCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: vs(15), padding: s(8), borderRadius: ms(6), backgroundColor: Colors.WHITE }, field: { marginTop: vs(18) }, input: { height: vs(30), marginTop: vs(5), borderWidth: 1, borderColor: Colors.BODYTEXT_DISABLED, borderRadius: ms(5) },
	approval: { width: s(208), alignItems: "center", paddingVertical: vs(25), borderRadius: ms(10), backgroundColor: Colors.WHITE }, dots: { flexDirection: "row", gap: s(4), marginTop: vs(20) }, activeDot: { width: s(25), height: vs(3), borderRadius: ms(2), backgroundColor: Colors.POINTCOLOR }, dot: { width: s(14), height: vs(3), borderRadius: ms(2), backgroundColor: "#D9D9D9" },
});
