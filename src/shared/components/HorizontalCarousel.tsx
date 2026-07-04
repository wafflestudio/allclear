import React, { useRef } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated from 'react-native-reanimated'

import { Club } from '@/entities/club'
import ClubPreviewCard from '@/shared/components/ClubPreviewCard'
import useAutoScroll from '@/shared/hooks/useAutoScroll'
import { s } from '@/shared/utils/scale'

export const HORIZONTAL_CAROUSEL_BOTTOM_PADDING = s(2)

type Props = {
	clubs: Club[]
	onPressClub: (club: Club) => void
}

const HorizontalCarousel = ({ clubs, onPressClub }: Props) => {
	const { listRef, pauseAutoScroll, resumeAutoScroll, ...scrollEventProps } = useAutoScroll<Club>(
		clubs.length,
	)
	const isUserDraggingRef = useRef(false)
	const isMomentumScrollingRef = useRef(false)

	const handleScrollBeginDrag = () => {
		isUserDraggingRef.current = true
		isMomentumScrollingRef.current = false
		pauseAutoScroll()
	}

	const handleScrollEndDrag = () => {
		isUserDraggingRef.current = false
		resumeAutoScroll(350)
	}

	const handleMomentumScrollBegin = () => {
		isMomentumScrollingRef.current = true
		pauseAutoScroll()
	}

	const handleMomentumScrollEnd = () => {
		isMomentumScrollingRef.current = false
		resumeAutoScroll(450)
	}

	return (
		<Animated.FlatList
			ref={listRef}
			{...scrollEventProps}
			horizontal
			decelerationRate="normal"
			showsHorizontalScrollIndicator={false}
			style={styles.list}
			contentContainerStyle={styles.contentContainer}
			scrollEventThrottle={16}
			onScrollBeginDrag={handleScrollBeginDrag}
			onScrollEndDrag={handleScrollEndDrag}
			onMomentumScrollBegin={handleMomentumScrollBegin}
			onMomentumScrollEnd={handleMomentumScrollEnd}
			data={clubs}
			keyExtractor={item => item.id}
			ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
			renderItem={({ item }) => (
				<ClubPreviewCard
					title={item.name}
					description={item.description ?? ''}
					imageSource={{ uri: item.imageUri }}
					onPress={() => onPressClub(item)}
					onPressIn={pauseAutoScroll}
					onPressOut={() => resumeAutoScroll(150)}
					shouldHandleManualTap={() =>
						!isUserDraggingRef.current && !isMomentumScrollingRef.current
					}
				/>
			)}
		/>
	)
}

export default HorizontalCarousel

const styles = StyleSheet.create({
	list: {
		width: '100%',
		overflow: 'visible',
	},
	contentContainer: {
		paddingHorizontal: s(20),
		paddingBottom: HORIZONTAL_CAROUSEL_BOTTOM_PADDING,
	},
	itemSeparator: {
		width: 10,
	},
})
