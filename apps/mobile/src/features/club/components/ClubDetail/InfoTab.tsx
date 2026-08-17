import React, { useCallback, useState } from "react";
import {
	Image,
	type LayoutChangeEvent,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import type { Club } from "@/entities/club";
import HtmlView from "@/shared/components/HtmlView";
import ImageViewerModal from "@/shared/components/ImageViewerModal";
import { Colors } from "@/shared/constants/colors";
import { typography } from "@/shared/constants/typography";
import { ms, s, vs } from "@/shared/utils/scale";
import BackgroundCard from "./BackgroundCard";

type Props = {
	club: Club;
	contentWidth: number;
};

const COLLAPSED_MAX_HEIGHT = vs(115);
const FADE_COLORS = ["rgba(255, 255, 255, 0)", Colors.WHITE];

const formatFoundedAt = (value: string): string => {
	const [year, month, day] = value.split("-").map(Number);
	return year && month && day ? `${year}년 ${month}월 ${day}일` : value;
};

const StatePills = ({
	active,
	trueLabel = "있음",
	falseLabel = "없음",
	falseFirst = false,
	detail,
	detailOnNewLine = false,
}: {
	active: boolean;
	trueLabel?: string;
	falseLabel?: string;
	falseFirst?: boolean;
	detail?: string;
	detailOnNewLine?: boolean;
}) => {
	const options = falseFirst
		? [
				{ label: falseLabel, value: false },
				{ label: trueLabel, value: true },
			]
		: [
				{ label: trueLabel, value: true },
				{ label: falseLabel, value: false },
			];

	return (
		<View
			style={[
				styles.stateContent,
				detailOnNewLine && styles.stateContentColumn,
			]}
		>
			<View style={styles.statePills}>
				{options.map((option) => {
					const selected = option.value === active;

					return (
						<View
							key={option.label}
							style={[styles.statePill, selected && styles.statePillActive]}
						>
							<Text
								style={[
									styles.statePillText,
									selected && styles.statePillTextActive,
								]}
							>
								{option.label}
							</Text>
						</View>
					);
				})}
			</View>
			{!!detail && (
				<View style={styles.detailTag}>
					<Text style={styles.detailTagText}>{detail}</Text>
				</View>
			)}
		</View>
	);
};

const InfoTab = ({ club, contentWidth }: Props) => {
	const [descriptionExpanded, setDescriptionExpanded] = useState(false);
	const [contentHeight, setContentHeight] = useState<number | null>(null);
	const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
		null,
	);

	const onContentLayout = useCallback((event: LayoutChangeEvent) => {
		const height = event.nativeEvent.layout.height;
		setContentHeight((previous) =>
			previous === null || height > previous ? height : previous,
		);
	}, []);

	const isLong = contentHeight !== null && contentHeight > COLLAPSED_MAX_HEIGHT;
	const collapsed = !descriptionExpanded && (contentHeight === null || isLong);
	const introduction = club.introduction?.trim();
	const minActivityPeriod = club.minActivityPeriod ?? 0;
	const activityImageUrls = club.activityImageUrls ?? [];
	const topItems = [
		{
			label: "분류",
			value: `${club.type} 동아리`,
			icon: "account-group-outline",
		},
		{ label: "카테고리", value: club.category, icon: "shape-outline" },
		{
			label: "모집형태",
			value: `${club.recruitType} 모집`,
			icon: "account-plus-outline",
		},
	];

	return (
		<View style={styles.container}>
			<BackgroundCard>
				<View style={styles.sections}>
					<View style={styles.iconRow}>
						{topItems.map((item, index) => (
							<React.Fragment key={item.label}>
								{index > 0 && <View style={styles.iconDivider} />}
								<View style={styles.iconCell}>
									<Icon
										name={item.icon}
										size={ms(28)}
										color={Colors.POINTCOLOR}
									/>
									<Text style={styles.iconLabel}>{item.label}</Text>
									<Text style={styles.iconValue} numberOfLines={2}>
										{item.value}
									</Text>
								</View>
							</React.Fragment>
						))}
					</View>

					<View style={styles.infoList}>
						<View style={styles.infoRow}>
							<Text style={styles.label}>동방 유무</Text>
							<StatePills
								active={club.hasDongbang}
								trueLabel="동방보유"
								falseLabel="동방없음"
								detail={
									club.dongbangLocation ? club.dongbangLocation : undefined
								}
								detailOnNewLine
							/>
						</View>
						<View style={styles.infoRow}>
							<Text style={styles.label}>최소활동 기간</Text>
							<StatePills
								active={minActivityPeriod > 0}
								falseFirst
								detail={
									minActivityPeriod > 0 ? `${minActivityPeriod}학기` : undefined
								}
							/>
						</View>
					</View>

					{!!introduction && (
						<View style={styles.descriptionSection}>
							<Text style={styles.label}>상세설명</Text>
							<View>
								<View style={collapsed && styles.descriptionCollapsed}>
									<View onLayout={onContentLayout}>
										<HtmlView html={introduction} contentWidth={contentWidth} />
									</View>
								</View>
								{collapsed && isLong && (
									<LinearGradient
										pointerEvents="none"
										colors={FADE_COLORS}
										style={styles.fade}
									/>
								)}
							</View>
							{isLong && (
								<Pressable
									accessibilityRole="button"
									accessibilityLabel={
										descriptionExpanded ? "상세설명 접기" : "상세설명 펼치기"
									}
									style={styles.toggle}
									onPress={() =>
										setDescriptionExpanded((previous) => !previous)
									}
								>
									<Icon
										name={descriptionExpanded ? "chevron-up" : "chevron-down"}
										size={ms(24)}
										color={Colors.BODYTEXT_SUB}
									/>
								</Pressable>
							)}
						</View>
					)}

					{(club.foundedAt || (club.activeMemberCount ?? 0) > 0) && (
						<View style={styles.plainInfoList}>
							{!!club.foundedAt && (
								<View style={styles.plainInfoRow}>
									<Text style={styles.label}>설립일</Text>
									<Text style={styles.plainValue}>
										{formatFoundedAt(club.foundedAt)}
									</Text>
								</View>
							)}
							{(club.activeMemberCount ?? 0) > 0 && (
								<View style={styles.plainInfoRow}>
									<Text style={styles.label}>활동 인원</Text>
									<Text style={styles.plainValue}>
										약 {club.activeMemberCount}명
									</Text>
								</View>
							)}
						</View>
					)}
				</View>
			</BackgroundCard>

			{activityImageUrls.length > 0 && (
				<View style={styles.photoSection}>
					<Text style={styles.photoTitle}>활동 사진</Text>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.photoList}
					>
						{activityImageUrls.map((url, index) => (
							<Pressable
								key={url}
								accessibilityRole="button"
								accessibilityLabel={`활동 사진 ${index + 1} 확대`}
								onPress={() => setSelectedImageIndex(index)}
							>
								<Image
									source={{ uri: url }}
									style={styles.activityImage}
									resizeMode="cover"
								/>
							</Pressable>
						))}
					</ScrollView>
				</View>
			)}

			<ImageViewerModal
				imageUrls={activityImageUrls}
				initialIndex={selectedImageIndex ?? 0}
				visible={selectedImageIndex !== null}
				onClose={() => setSelectedImageIndex(null)}
			/>
		</View>
	);
};

export default InfoTab;

const styles = StyleSheet.create({
	container: { marginTop: vs(16), gap: vs(20) },
	sections: { gap: vs(22) },
	iconRow: { flexDirection: "row" },
	iconCell: {
		flex: 1,
		alignItems: "center",
		gap: vs(5),
		paddingHorizontal: s(4),
	},
	iconDivider: { width: 1, backgroundColor: Colors.TEXTBOX_SELECTED },
	iconLabel: { ...typography.bodySRegular, color: Colors.BODYTEXT_SUB_2 },
	iconValue: {
		...typography.bodyMMedium,
		color: Colors.BODYTEXT_SUB,
		textAlign: "center",
	},
	infoList: { gap: vs(14) },
	infoRow: { gap: vs(8) },
	label: { ...typography.bodyMRegular, color: Colors.BODYTEXT_SUB_2 },
	stateContent: {
		flexDirection: "row",
		flexWrap: "wrap",
		alignItems: "center",
		gap: s(6),
	},
	stateContentColumn: { flexDirection: "column", alignItems: "flex-start" },
	statePills: { flexDirection: "row", gap: s(6) },
	statePill: {
		height: vs(30),
		paddingHorizontal: s(15),
		borderWidth: 0.65,
		borderColor: Colors.BADGE_UNSELECTED,
		borderRadius: ms(20),
		alignItems: "center",
		justifyContent: "center",
	},
	statePillActive: {
		backgroundColor: Colors.POINTCOLOR,
		borderColor: Colors.POINTCOLOR,
	},
	statePillText: {
		...typography.bodySMedium,
		color: Colors.BADGE_UNSELECTED,
		lineHeight: vs(17),
		letterSpacing: ms(-0.24),
	},
	statePillTextActive: { ...typography.bodySSemibold, color: Colors.WHITE },
	detailTag: {
		paddingHorizontal: s(15),
		paddingVertical: vs(8),
		borderWidth: 1,
		borderColor: Colors.POINTCOLOR,
		borderRadius: ms(10),
		backgroundColor: Colors.POINTCOLOR_10,
	},
	detailTagText: { ...typography.bodySSemibold, color: Colors.BODYTEXT_SUB },
	descriptionSection: { gap: vs(8) },
	descriptionCollapsed: { maxHeight: COLLAPSED_MAX_HEIGHT, overflow: "hidden" },
	fade: { position: "absolute", left: 0, right: 0, bottom: 0, height: vs(28) },
	toggle: {
		minHeight: ms(44),
		alignItems: "center",
		justifyContent: "center",
		marginTop: -vs(8),
	},
	plainInfoList: { gap: vs(12) },
	plainInfoRow: { flexDirection: "row", alignItems: "center" },
	plainValue: {
		...typography.bodyMMedium,
		color: Colors.BODYTEXT_SUB,
		marginLeft: "auto",
	},
	photoSection: { gap: vs(10) },
	photoTitle: { ...typography.headerL, color: Colors.BODYTEXT_SUB },
	photoList: { gap: s(10) },
	activityImage: {
		width: s(150),
		height: s(106),
		borderRadius: ms(12),
		backgroundColor: Colors.WHITE,
	},
});
