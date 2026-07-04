import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

import { Club } from '@/entities/club'
import { CategoryDetail } from '@/shared/constants/category'
import { Colors } from '@/shared/constants/colors'
import { typography } from '@/shared/constants/typography'
import { ms, vs } from '@/shared/utils/scale'
import BackgroundCard from './BackgroundCard'
import ReviewKeywordBar from './ReviewKeywordBar'
import { ClubDetailTabLabel } from './ClubDetailTabBar'
import LoginBlurOverlay from './LoginBlurOverlay'

type Props = {
	club: Club
	tabLabel: ClubDetailTabLabel
	categoryDetail: CategoryDetail
	isLoggedIn: boolean
	onLoginPress: () => void
	onWriteReview: () => void
}

const ReviewTab = ({
	club,
	tabLabel,
	categoryDetail,
	isLoggedIn,
	onLoginPress,
	onWriteReview,
}: Props) => {
	const sortedKeywords = [...club.reviewKeywords].sort((a, b) => b.totalUpvotes - a.totalUpvotes)

	return (
		<View style={styles.tabSection}>
			<BackgroundCard>
				{!isLoggedIn && (
					<LoginBlurOverlay clubName={club.name} tabLabel={tabLabel} onLoginPress={onLoginPress} />
				)}
				<Text style={styles.sectionTitle}>이런 점이 좋았어요</Text>
				{club.totalReviews > 0 && (
					<Text style={styles.sectionMeta}>{`현재까지 ${club.totalReviews}명이 참여했어요`}</Text>
				)}
				{sortedKeywords.length > 0 ? (
					<View style={styles.pillsContainer}>
						{sortedKeywords.map(keyword => (
							<ReviewKeywordBar
								key={keyword.id}
								keyword={keyword}
								totalReviews={club.totalReviews}
								themeColor={categoryDetail.themeColor}
							/>
						))}
					</View>
				) : (
					<View style={styles.emptyReview}>
						<Text style={styles.emptyText}>{`혹시 ${club.name}에서 활동하셨나요?`}</Text>
						<Text style={styles.emptyText}>다음에 들어올 부원들을 위해 경험을 공유해주세요!</Text>
					</View>
				)}
			</BackgroundCard>

			<Pressable onPress={onWriteReview}>
				{({ pressed }) => (
					<BackgroundCard style={[styles.ctaCard, pressed && styles.ctaCardPressed]}>
						<View style={styles.ctaRow}>
							<View>
								<Text style={styles.ctaTitle}>동아리 활동 후기 남기기</Text>
								<Text style={styles.ctaMeta}>{`현재까지 ${club.totalReviews}명이 참여했어요`}</Text>
							</View>
							<Icon name="chevron-right" size={ms(24)} color={Colors.POINTCOLOR} />
						</View>
					</BackgroundCard>
				)}
			</Pressable>
		</View>
	)
}

export default ReviewTab

const styles = StyleSheet.create({
	tabSection: {
		marginTop: vs(16),
		gap: vs(12),
	},
	sectionTitle: {
		...typography.headerL,
		color: Colors.BODYTEXT_SUB,
	},
	sectionMeta: {
		...typography.bodySMedium,
		color: Colors.BODYTEXT_SUB,
		marginTop: vs(4),
	},
	pillsContainer: {
		marginTop: vs(12),
		gap: vs(5),
	},
	emptyReview: {
		minHeight: vs(80),
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: vs(12),
	},
	emptyText: {
		...typography.bodySMedium,
		color: Colors.BODYTEXT_SUB,
		textAlign: 'center',
	},
	ctaCard: {
		marginTop: vs(4),
	},
	ctaCardPressed: {
		backgroundColor: Colors.BACKGROUND_SUB,
	},
	ctaRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	ctaTitle: {
		...typography.bodyMSemibold,
		color: Colors.POINTCOLOR,
	},
	ctaMeta: {
		...typography.bodySRegular,
		color: Colors.BODYTEXT_SUB_2,
		marginTop: vs(4),
	},
})
