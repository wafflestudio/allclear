import { useMemo, useState } from "react";
import {
	Image,
	Linking,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import type { MixedStyleDeclaration } from "react-native-render-html";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import {
	formatRecruitmentDeadline,
	formatRegularMeeting,
	getRecruitmentApplicationUrl,
	getRecruitmentTextPreview,
	shouldStackActivityLocation,
	shouldStackRegularMeetings,
} from "@/features/club/utils/recruitmentPresentation";
import type { RecruitmentContent } from "@/repositories/recruitment";
import HtmlView from "@/shared/components/HtmlView";
import ImageViewerModal from "@/shared/components/ImageViewerModal";
import { Colors } from "@/shared/constants/colors";
import { typography } from "@/shared/constants/typography";
import { ms, s, vs } from "@/shared/utils/scale";

type Props = {
	content: RecruitmentContent;
};

const FULL_TEXT_BASE_STYLE: MixedStyleDeclaration = {
	...(typography.bodyMRegular as MixedStyleDeclaration),
	color: Colors.BODYTEXT_SUB,
	lineHeight: vs(21),
};

const BooleanPills = ({
	active,
	trueLabel = "있음",
	falseLabel = "없음",
	falseFirst = false,
}: {
	active: boolean;
	trueLabel?: string;
	falseLabel?: string;
	falseFirst?: boolean;
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
		<View style={styles.booleanPills}>
			{options.map((option) => {
				const selected = option.value === active;

				return (
					<View
						key={option.label}
						style={[styles.booleanPill, selected && styles.booleanPillActive]}
					>
						<Text
							style={[styles.booleanText, selected && styles.booleanTextActive]}
						>
							{option.label}
						</Text>
					</View>
				);
			})}
		</View>
	);
};

const DetailTag = ({ text }: { text: string }) => (
	<View style={styles.detailTag}>
		<Text style={styles.detailTagText}>{text}</Text>
	</View>
);

const BooleanDetailRow = ({
	label,
	active,
	detail,
	trueLabel,
	falseLabel,
	falseFirst,
}: {
	label: string;
	active: boolean;
	detail?: string;
	trueLabel?: string;
	falseLabel?: string;
	falseFirst?: boolean;
}) => (
	<View style={styles.field}>
		<Text style={styles.fieldLabel}>{label}</Text>
		<View style={styles.fieldValue}>
			<BooleanPills
				active={active}
				trueLabel={trueLabel}
				falseLabel={falseLabel}
				falseFirst={falseFirst}
			/>
			{!!detail && <Text style={styles.bodyText}>{detail}</Text>}
		</View>
	</View>
);

const RecruitmentDetailCard = ({ content }: Props) => {
	const [fullTextExpanded, setFullTextExpanded] = useState(false);
	const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
		null,
	);
	const meetingTags = content.regular_meetings.map(formatRegularMeeting);
	const stackMeetings = shouldStackRegularMeetings(meetingTags.length);
	const stackLocation = shouldStackActivityLocation(
		content.activity_location_text,
	);
	const fullTextPreview = useMemo(
		() =>
			content.full_recruitment_text
				? getRecruitmentTextPreview(content.full_recruitment_text)
				: "",
		[content.full_recruitment_text],
	);
	const locationTypes = ["동방", "동방 외", "미정"];

	return (
		<View style={styles.container}>
			<View style={styles.titleSection}>
				<Text style={styles.title}>{content.title}</Text>
				<Text style={styles.deadline}>
					{formatRecruitmentDeadline(content.deadline)}
				</Text>
			</View>

			{content.image_urls.length > 0 && (
				<View>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.imageList}
					>
						{content.image_urls.map((url, index) => (
							<Pressable
								key={url}
								accessibilityRole="button"
								accessibilityLabel={`공고 사진 ${index + 1} 확대`}
								onPress={() => setSelectedImageIndex(index)}
							>
								<Image
									source={{ uri: url }}
									style={styles.recruitmentImage}
									resizeMode="cover"
								/>
							</Pressable>
						))}
					</ScrollView>
					{content.image_urls.length >= 3 && (
						<LinearGradient
							pointerEvents="none"
							colors={["rgba(255, 255, 255, 0)", Colors.WHITE]}
							start={{ x: 0, y: 0.5 }}
							end={{ x: 1, y: 0.5 }}
							style={styles.imageFade}
						/>
					)}
				</View>
			)}

			<View style={styles.fields}>
				<BooleanDetailRow label="필참활동 여부" active={content.is_mandatory} />

				<View style={styles.field}>
					<Text style={styles.fieldLabel}>정기모임 일시</Text>
					<View style={styles.valueLine}>
						<BooleanPills active={content.has_regular_meeting} />
						{!stackMeetings &&
							meetingTags.map((tag) => <DetailTag key={tag} text={tag} />)}
					</View>
					{stackMeetings && (
						<View style={styles.wrappedTags}>
							{meetingTags.map((tag) => (
								<DetailTag key={tag} text={tag} />
							))}
						</View>
					)}
				</View>

				<View style={styles.field}>
					<Text style={styles.fieldLabel}>활동 장소</Text>
					<View style={styles.valueLine}>
						<View style={styles.locationTypes}>
							{locationTypes.map((type) => {
								const selected = type === content.activity_location_type;
								return (
									<View
										key={type}
										style={[
											styles.booleanPill,
											selected && styles.booleanPillActive,
										]}
									>
										<Text
											style={[
												styles.booleanText,
												selected && styles.booleanTextActive,
											]}
										>
											{type}
										</Text>
									</View>
								);
							})}
						</View>
						{!stackLocation && !!content.activity_location_text && (
							<DetailTag text={content.activity_location_text} />
						)}
					</View>
					{stackLocation && !!content.activity_location_text && (
						<View style={styles.locationDetailBelow}>
							<DetailTag text={content.activity_location_text} />
						</View>
					)}
				</View>

				<BooleanDetailRow
					label="지원자격"
					active={content.has_eligibility}
					detail={content.eligibility_text || undefined}
				/>
				<BooleanDetailRow
					label="모집인원"
					active={content.has_capacity_limit}
					trueLabel="정원 있음"
					falseLabel="제한 없음"
					falseFirst
					detail={content.capacity_limit_text || undefined}
				/>
				<BooleanDetailRow
					label="회비"
					active={content.has_membership_fee}
					detail={content.membership_fee_text || undefined}
				/>

				<View style={styles.field}>
					<Text style={styles.fieldLabel}>가입절차</Text>
					<View style={styles.fieldValue}>
						{!!content.application_url && (
							<Pressable
								accessibilityRole="link"
								style={styles.linkRow}
								hitSlop={8}
								onPress={() =>
									Linking.openURL(
										getRecruitmentApplicationUrl(content.application_url),
									)
								}
							>
								<Text style={styles.linkText} numberOfLines={1}>
									{content.application_url}
								</Text>
							</Pressable>
						)}
						{!!content.application_process && (
							<Text style={styles.bodyText}>{content.application_process}</Text>
						)}
					</View>
				</View>
			</View>

			{!!content.full_recruitment_text && (
				<View style={styles.field}>
					<Text style={styles.fieldLabel}>공고 본문</Text>
					<View style={styles.fullTextContent}>
						{fullTextExpanded ? (
							<HtmlView
								html={content.full_recruitment_text}
								baseStyle={FULL_TEXT_BASE_STYLE}
							/>
						) : (
							<Text style={styles.fullTextPreview} numberOfLines={2}>
								{fullTextPreview}
							</Text>
						)}
						<Pressable
							accessibilityRole="button"
							accessibilityLabel={
								fullTextExpanded ? "공고 본문 접기" : "공고 본문 펼치기"
							}
							accessibilityState={{ expanded: fullTextExpanded }}
							style={styles.fullTextToggle}
							hitSlop={10}
							onPress={() => setFullTextExpanded((previous) => !previous)}
						>
							<Icon
								name={fullTextExpanded ? "chevron-up" : "chevron-down"}
								size={ms(14)}
								color={Colors.BODYTEXT_SUB}
							/>
						</Pressable>
					</View>
				</View>
			)}

			<ImageViewerModal
				imageUrls={content.image_urls}
				initialIndex={selectedImageIndex ?? 0}
				visible={selectedImageIndex !== null}
				onClose={() => setSelectedImageIndex(null)}
			/>
		</View>
	);
};

export default RecruitmentDetailCard;

const styles = StyleSheet.create({
	container: { gap: vs(15) },
	titleSection: { gap: vs(6) },
	title: { ...typography.headerXL, color: Colors.BODYTEXT_SUB },
	deadline: { ...typography.headerL, color: Colors.POINTCOLOR },
	imageList: { gap: s(10) },
	recruitmentImage: {
		width: s(120),
		height: s(120),
		borderWidth: 1,
		borderColor: Colors.BODYTEXT_DISABLED,
		borderRadius: ms(8),
	},
	imageFade: {
		position: "absolute",
		top: 0,
		right: 0,
		bottom: 0,
		width: s(50),
	},
	fields: { gap: vs(15) },
	field: { gap: vs(7) },
	fieldValue: { gap: vs(10) },
	fieldLabel: { ...typography.bodyMRegular, color: Colors.BODYTEXT_SUB_2 },
	valueLine: {
		flexDirection: "row",
		flexWrap: "wrap",
		alignItems: "center",
		gap: s(7),
	},
	booleanPills: { flexDirection: "row", gap: s(6) },
	booleanPill: {
		height: vs(30),
		paddingHorizontal: s(15),
		borderWidth: 0.65,
		borderColor: Colors.BADGE_UNSELECTED,
		borderRadius: ms(20),
		alignItems: "center",
		justifyContent: "center",
	},
	booleanPillActive: {
		backgroundColor: Colors.POINTCOLOR,
		borderColor: Colors.POINTCOLOR,
	},
	booleanText: {
		...typography.bodySMedium,
		color: Colors.BADGE_UNSELECTED,
		lineHeight: vs(17),
		letterSpacing: ms(-0.24),
	},
	booleanTextActive: {
		...typography.bodySSemibold,
		color: Colors.WHITE,
		letterSpacing: 0,
	},
	detailTag: {
		alignSelf: "flex-start",
		maxWidth: "100%",
		paddingHorizontal: s(15),
		paddingVertical: vs(8),
		borderWidth: 1,
		borderColor: Colors.POINTCOLOR,
		borderRadius: ms(10),
		backgroundColor: Colors.POINTCOLOR_10,
	},
	detailTagText: { ...typography.bodySSemibold, color: Colors.BODYTEXT_SUB },
	wrappedTags: { flexDirection: "row", flexWrap: "wrap", gap: s(7) },
	locationTypes: { flexDirection: "row", gap: s(7) },
	locationDetailBelow: { alignSelf: "flex-start" },
	bodyText: {
		...typography.bodyMRegular,
		color: Colors.BODYTEXT_SUB,
		lineHeight: vs(21),
	},
	linkRow: { alignSelf: "flex-start", maxWidth: "100%" },
	linkText: {
		...typography.bodyMMedium,
		color: Colors.POINTCOLOR,
		textDecorationLine: "underline",
		flexShrink: 1,
	},
	fullTextContent: { gap: vs(4) },
	fullTextPreview: {
		...typography.bodyMRegular,
		color: Colors.BODYTEXT_SUB,
		lineHeight: vs(21),
	},
	fullTextToggle: {
		width: ms(44),
		height: vs(24),
		alignSelf: "center",
		alignItems: "center",
		justifyContent: "center",
	},
});
