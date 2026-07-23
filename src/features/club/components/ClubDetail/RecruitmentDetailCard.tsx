import dayjs from 'dayjs'
import React, { useState } from 'react'
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import type { RecruitmentContent } from '@/repositories/recruitment'
import HtmlView from '@/shared/components/HtmlView'
import { Colors } from '@/shared/constants/colors'
import { typography } from '@/shared/constants/typography'
import { ms, s, vs } from '@/shared/utils/scale'
import {
	formatRegularMeeting,
	shouldStackActivityLocation,
	shouldStackRegularMeetings,
} from '@/features/club/utils/recruitmentPresentation'

type Props = {
	content: RecruitmentContent
	contentWidth: number
}

const BooleanPills = ({ active }: { active: boolean }) => (
	<View style={styles.booleanPills}>
		<View style={[styles.booleanPill, active && styles.booleanPillActive]}>
			<Text style={[styles.booleanText, active && styles.booleanTextActive]}>있음</Text>
		</View>
		<View style={[styles.booleanPill, !active && styles.booleanPillActive]}>
			<Text style={[styles.booleanText, !active && styles.booleanTextActive]}>없음</Text>
		</View>
	</View>
)

const DetailTag = ({ text }: { text: string }) => (
	<View style={styles.detailTag}>
		<Text style={styles.detailTagText}>{text}</Text>
	</View>
)

const BooleanDetailRow = ({
	label,
	active,
	detail,
}: {
	label: string
	active: boolean
	detail?: string
}) => (
	<View style={styles.field}>
		<Text style={styles.fieldLabel}>{label}</Text>
		<View style={styles.valueLine}>
			<BooleanPills active={active} />
			{!!detail && <DetailTag text={detail} />}
		</View>
	</View>
)

const RecruitmentDetailCard = ({ content, contentWidth }: Props) => {
	const [fullTextExpanded, setFullTextExpanded] = useState(false)
	const meetingTags = content.regular_meetings.map(formatRegularMeeting)
	const stackMeetings = shouldStackRegularMeetings(meetingTags.length)
	const stackLocation = shouldStackActivityLocation(content.activity_location_text)
	const locationTypes = ['동방', '동방 외', '미정']

	return (
		<View style={styles.container}>
			<View style={styles.titleSection}>
				<Text style={styles.title}>{content.title}</Text>
				<Text style={styles.deadline}>~ {dayjs(content.deadline).format('M월 D일')} 모집</Text>
			</View>

			{content.image_urls.length > 0 && (
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.imageList}>
					{content.image_urls.map((url, index) => (
						<Image key={`${url}-${index}`} source={{ uri: url }} style={styles.recruitmentImage} />
					))}
				</ScrollView>
			)}

			<View style={styles.fields}>
				<BooleanDetailRow label="필수 참여 여부" active={content.is_mandatory} />

				<View style={styles.field}>
					<Text style={styles.fieldLabel}>정기 모임</Text>
					<View style={styles.valueLine}>
						<BooleanPills active={content.has_regular_meeting} />
						{!stackMeetings &&
							meetingTags.map((tag, index) => <DetailTag key={`${tag}-${index}`} text={tag} />)}
					</View>
					{stackMeetings && (
						<View style={styles.wrappedTags}>
							{meetingTags.map((tag, index) => (
								<DetailTag key={`${tag}-${index}`} text={tag} />
							))}
						</View>
					)}
				</View>

				<View style={styles.field}>
					<Text style={styles.fieldLabel}>활동 장소</Text>
					<View style={styles.valueLine}>
						<View style={styles.locationTypes}>
							{locationTypes.map(type => {
								const selected = type === content.activity_location_type
								return (
									<View
										key={type}
										style={[styles.locationType, selected && styles.locationTypeActive]}>
										<Text style={[styles.booleanText, selected && styles.booleanTextActive]}>
											{type}
										</Text>
									</View>
								)
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
					label="지원 자격"
					active={content.has_eligibility}
					detail={content.has_eligibility ? content.eligibility_text : undefined}
				/>
				<BooleanDetailRow
					label="모집 정원"
					active={content.has_capacity_limit}
					detail={content.has_capacity_limit ? content.capacity_limit_text : undefined}
				/>
				<BooleanDetailRow
					label="회비"
					active={content.has_membership_fee}
					detail={content.has_membership_fee ? content.membership_fee_text : undefined}
				/>

				<View style={styles.textField}>
					<Text style={styles.fieldLabel}>지원 링크</Text>
					<Pressable
						accessibilityRole="link"
						style={styles.linkRow}
						onPress={() => Linking.openURL(content.application_url)}>
						<Text style={styles.linkText} numberOfLines={1}>
							{content.application_url}
						</Text>
						<Icon name="open-in-new" size={ms(16)} color={Colors.POINTCOLOR} />
					</Pressable>
				</View>

				<View style={styles.textField}>
					<Text style={styles.fieldLabel}>가입 절차</Text>
					<Text style={styles.bodyText}>{content.application_process}</Text>
				</View>
			</View>

			{!!content.full_recruitment_text && (
				<View style={styles.fullTextSection}>
					<Pressable
						accessibilityRole="button"
						style={styles.fullTextHeader}
						onPress={() => setFullTextExpanded(previous => !previous)}>
						<Text style={styles.fullTextTitle}>공고 전체 내용</Text>
						<Icon
							name={fullTextExpanded ? 'chevron-up' : 'chevron-down'}
							size={ms(22)}
							color={Colors.BODYTEXT_SUB}
						/>
					</Pressable>
					{fullTextExpanded && (
						<HtmlView html={content.full_recruitment_text} contentWidth={contentWidth} />
					)}
				</View>
			)}
		</View>
	)
}

export default RecruitmentDetailCard

const styles = StyleSheet.create({
	container: { gap: vs(20) },
	titleSection: { gap: vs(5) },
	title: { ...typography.headerXL, color: Colors.BODYTEXT_MAIN },
	deadline: { ...typography.bodyMMedium, color: Colors.POINTCOLOR },
	imageList: { gap: s(10) },
	recruitmentImage: { width: s(164), height: s(112), borderRadius: ms(12) },
	fields: { gap: vs(18) },
	field: { gap: vs(8) },
	fieldLabel: { ...typography.bodyMRegular, color: Colors.BODYTEXT_SUB_2 },
	valueLine: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: s(8) },
	booleanPills: { flexDirection: 'row', gap: s(6) },
	booleanPill: {
		minWidth: s(54),
		paddingHorizontal: s(12),
		paddingVertical: vs(7),
		borderRadius: ms(18),
		backgroundColor: Colors.BACKGROUND_SUB,
		alignItems: 'center',
	},
	booleanPillActive: { backgroundColor: Colors.POINTCOLOR },
	booleanText: { ...typography.bodySMedium, color: Colors.BODYTEXT_SUB_2 },
	booleanTextActive: { color: Colors.WHITE },
	detailTag: {
		alignSelf: 'flex-start',
		maxWidth: '100%',
		paddingHorizontal: s(12),
		paddingVertical: vs(7),
		borderRadius: ms(18),
		backgroundColor: Colors.POINTCOLOR_10,
	},
	detailTagText: { ...typography.bodySMedium, color: Colors.POINTCOLOR },
	wrappedTags: { flexDirection: 'row', flexWrap: 'wrap', gap: s(8) },
	locationTypes: { flexDirection: 'row', gap: s(5) },
	locationType: {
		paddingHorizontal: s(10),
		paddingVertical: vs(7),
		borderRadius: ms(18),
		backgroundColor: Colors.BACKGROUND_SUB,
	},
	locationTypeActive: { backgroundColor: Colors.POINTCOLOR },
	locationDetailBelow: { alignSelf: 'flex-start' },
	textField: { gap: vs(7) },
	bodyText: { ...typography.bodyMMedium, color: Colors.BODYTEXT_SUB, lineHeight: vs(21) },
	linkRow: { flexDirection: 'row', alignItems: 'center', gap: s(5) },
	linkText: {
		...typography.bodyMMedium,
		color: Colors.POINTCOLOR,
		textDecorationLine: 'underline',
		flexShrink: 1,
	},
	fullTextSection: {
		borderTopWidth: 1,
		borderTopColor: Colors.TEXTBOX_SELECTED,
		paddingTop: vs(14),
	},
	fullTextHeader: {
		minHeight: ms(44),
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	fullTextTitle: { ...typography.bodyMSemibold, color: Colors.BODYTEXT_SUB },
})
