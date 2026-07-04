import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { Club } from '@/entities/club'
import HorizontalCarousel, {
	HORIZONTAL_CAROUSEL_BOTTOM_PADDING,
} from '@/shared/components/HorizontalCarousel'
import {
	CLUB_PREVIEW_CARD_HEIGHT,
	ClubPreviewCardSkeleton,
} from '@/shared/components/ClubPreviewCard'
import { Colors } from '@/shared/constants/colors'
import { typography } from '@/shared/constants/typography'
import { s, vs } from '@/shared/utils/scale'

type Props = {
	clubs: Club[]
	onPressClub: (club: Club) => void
}

const SKELETON_CARD_COUNT = 3
const RECOMMENDATION_CAROUSEL_HEIGHT = CLUB_PREVIEW_CARD_HEIGHT + HORIZONTAL_CAROUSEL_BOTTOM_PADDING

const RandomRecommendationsHeader = () => (
	<View style={styles.header}>
		<Text style={styles.title}>이런 동아리는 어때요?</Text>
		<Text style={styles.subtitle}>다양한 동아리를 추천해드려요</Text>
	</View>
)

export const RandomRecommendationsSkeleton = () => (
	<View style={styles.container}>
		<RandomRecommendationsHeader />
		<View style={styles.carouselSlot}>
			<View style={styles.skeletonList}>
				{Array.from({ length: SKELETON_CARD_COUNT }).map((_, index) => (
					<ClubPreviewCardSkeleton key={index} />
				))}
			</View>
		</View>
	</View>
)

const RandomRecommendations = ({ clubs, onPressClub }: Props) => {
	if (clubs.length === 0) {
		return null
	}

	return (
		<View style={styles.container}>
			<RandomRecommendationsHeader />
			<View style={styles.carouselSlot}>
				<HorizontalCarousel clubs={clubs} onPressClub={onPressClub} />
			</View>
		</View>
	)
}

export default RandomRecommendations

const styles = StyleSheet.create({
	container: {
		backgroundColor: Colors.BACKGROUND_SUB,
		paddingTop: vs(24),
		paddingBottom: vs(30),
		gap: vs(16),
	},
	header: {
		paddingHorizontal: s(20),
		gap: vs(4),
	},
	title: {
		...typography.headerL,
		color: Colors.BODYTEXT_SUB,
	},
	subtitle: {
		...typography.bodySRegular,
		color: Colors.BODYTEXT_SUB,
	},
	carouselSlot: {
		height: RECOMMENDATION_CAROUSEL_HEIGHT,
		overflow: 'visible',
	},
	skeletonList: {
		flexDirection: 'row',
		height: '100%',
		paddingHorizontal: s(20),
		paddingBottom: s(2),
		gap: s(10),
		overflow: 'hidden',
	},
})
