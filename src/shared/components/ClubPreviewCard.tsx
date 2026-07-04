import React from 'react'
import {
	Image,
	ImageSourcePropType,
	ImageStyle,
	Pressable,
	StyleProp,
	StyleSheet,
	Text,
	View,
	ViewStyle,
} from 'react-native'
import SkeletonPlaceholder from 'react-native-skeleton-placeholder'

import { Colors } from '@/shared/constants/colors'
import { typography } from '@/shared/constants/typography'
import { ms, s, vs } from '@/shared/utils/scale'

export const CLUB_PREVIEW_CARD_WIDTH = s(110)
export const CLUB_PREVIEW_CARD_TEXT_HEIGHT = vs(54)
export const CLUB_PREVIEW_CARD_HEIGHT = CLUB_PREVIEW_CARD_WIDTH + CLUB_PREVIEW_CARD_TEXT_HEIGHT

type Props = {
	title: string
	description: string
	imageSource: ImageSourcePropType
	onPress?: () => void
	style?: StyleProp<ViewStyle>
	imageStyle?: StyleProp<ImageStyle>
}

type ClubPreviewCardFrameProps = {
	children: React.ReactNode
	onPress?: () => void
	style?: StyleProp<ViewStyle>
}

const ClubPreviewCardFrame = ({ children, onPress, style }: ClubPreviewCardFrameProps) => {
	const content = <View style={styles.cardContainer}>{children}</View>

	if (!onPress) {
		return <View style={[styles.shadowContainer, styles.cardWidth, style]}>{content}</View>
	}

	return (
		<Pressable
			style={({ pressed }) => [
				styles.shadowContainer,
				styles.cardWidth,
				style,
				pressed && styles.pressed,
			]}
			onPress={onPress}>
			{content}
		</Pressable>
	)
}

const ClubPreviewCard = ({
	title,
	description,
	imageSource,
	onPress,
	style,
	imageStyle,
}: Props) => {
	return (
		<ClubPreviewCardFrame onPress={onPress} style={style}>
			<View style={styles.imageWrapper}>
				<Image source={imageSource} style={[styles.image, imageStyle]} resizeMode="cover" />
			</View>
			<View style={styles.textWrapper}>
				<Text numberOfLines={1} ellipsizeMode="tail" style={styles.title}>
					{title}
				</Text>
				<Text numberOfLines={1} ellipsizeMode="tail" style={styles.description}>
					{description}
				</Text>
			</View>
		</ClubPreviewCardFrame>
	)
}

export const ClubPreviewCardSkeleton = () => (
	<ClubPreviewCardFrame>
		<View style={styles.imageWrapper}>
			<SkeletonPlaceholder backgroundColor={Colors.BACKGROUND_MAIN} highlightColor={Colors.WHITE}>
				<SkeletonPlaceholder.Item width={'100%'} height={'100%'} />
			</SkeletonPlaceholder>
		</View>
		<View style={styles.textWrapper}>
			<SkeletonPlaceholder backgroundColor={Colors.BACKGROUND_MAIN} highlightColor={Colors.WHITE}>
				<SkeletonPlaceholder.Item>
					<SkeletonPlaceholder.Item
						width={s(72)}
						height={vs(16)}
						borderRadius={ms(4)}
						marginBottom={vs(3)}
					/>
					<SkeletonPlaceholder.Item width={s(88)} height={vs(15)} borderRadius={ms(4)} />
				</SkeletonPlaceholder.Item>
			</SkeletonPlaceholder>
		</View>
	</ClubPreviewCardFrame>
)

export default ClubPreviewCard

const styles = StyleSheet.create({
	shadowContainer: {
		shadowColor: Colors.BLACK,
		shadowOffset: {
			width: 0,
			height: 1,
		},
		shadowOpacity: 0.1,
		shadowRadius: 7,
		elevation: 2,
		backgroundColor: Colors.WHITE, // android에서 shadow가 보이도록 배경색 설정 필수
		borderRadius: ms(15),
	},
	pressed: {
		opacity: 0.9,
	},
	cardWidth: {
		width: CLUB_PREVIEW_CARD_WIDTH,
	},
	cardContainer: {
		overflow: 'hidden',
		backgroundColor: Colors.WHITE,
		borderRadius: ms(15),
	},
	imageWrapper: {
		width: '100%',
		aspectRatio: 1,
	},
	image: {
		width: '100%',
		height: '100%',
	},
	textWrapper: {
		height: CLUB_PREVIEW_CARD_TEXT_HEIGHT,
		backgroundColor: Colors.WHITE,
		paddingHorizontal: s(10),
		paddingTop: vs(9),
		paddingBottom: vs(8),
	},
	title: {
		...typography.bodyMSemibold,
		color: Colors.BODYTEXT_MAIN,
		marginBottom: vs(3),
	},
	description: {
		...typography.bodySRegular,
		lineHeight: ms(15),
		color: Colors.BODYTEXT_SUB,
	},
})
