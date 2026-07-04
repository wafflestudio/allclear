import { Image, StyleSheet, Text, View } from 'react-native'
import { Pressable } from 'react-native-gesture-handler'

import { Colors } from '@/shared/constants/colors'
import { typography } from '@/shared/constants/typography'
import { Category } from '@/entities/category'
import { CategoryMap } from '@/shared/constants/category'
import { Club } from '@/entities/club'
import { ms, s, vs } from '@/shared/utils/scale'
import useSaveClub from '@/shared/hooks/useSaveClub'
import ReviewKeywordPill from '@/shared/components/ReviewKeywordPill'

type Props = {
	club: Club
	category?: Category['name']
	onPress?: () => void
}

const ClubCard = ({ club, category, onPress }: Props) => {
	const categoryDetail = category ? CategoryMap[category] : undefined
	const borderColor = categoryDetail ? categoryDetail.themeColor : Colors.BUTTON_SELECTED
	const backgroundColor = categoryDetail ? categoryDetail.backgroundColor : Colors.POINTCOLOR_10

	const { isSaved, handleToggle } = useSaveClub(club)

	const cardInner = (
		<>
			<View style={[styles.imageWrapper, { borderColor }]}>
				<Image style={styles.image} resizeMode="contain" source={{ uri: club.imageUri }} />
			</View>
			<View style={styles.contentWrapper}>
				<View style={styles.textGroup}>
					<Text style={styles.title}>{club.name}</Text>
					<Text numberOfLines={2} style={styles.description}>
						{club.description}
					</Text>
				</View>
				<View style={styles.reviewView}>
					{club.reviewKeywords && club.reviewKeywords.length > 0 ? (
						club.reviewKeywords
							.slice(0, 2)
							.map((keyword, index) => (
								<ReviewKeywordPill
									key={`${club.name}-${index}`}
									keyword={keyword}
									themeColor={borderColor}
									backgroundColor={backgroundColor}
								/>
							))
					) : (
						<ReviewKeywordPill
							keyword={{ iconUri: '🥲', title: '아직 활동 후기가 없어요' }}
							themeColor="#CBCBCB"
							backgroundColor="rgba(193, 193, 193, 0.1)"
						/>
					)}
				</View>
			</View>
		</>
	)

	return (
		<View style={styles.container}>
			{onPress ? (
				<Pressable
					style={({ pressed }) => [styles.cardContent, { opacity: pressed ? 0.5 : 1 }]}
					onPress={onPress}>
					{cardInner}
				</Pressable>
			) : (
				<View style={styles.cardContent}>{cardInner}</View>
			)}
			<Pressable
				onPress={handleToggle}
				hitSlop={ms(8)}
				style={({ pressed }) => [styles.heartButton, { opacity: pressed ? 0.5 : 1 }]}>
				<Image
					source={
						isSaved ? require('@/assets/icons/heart-fill.png') : require('@/assets/icons/heart.png')
					}
					style={styles.heartIcon}
					resizeMode="contain"
				/>
			</Pressable>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		width: '100%',
		height: s(90),
	},
	cardContent: {
		flex: 1,
		flexDirection: 'row',
	},
	imageWrapper: {
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: Colors.WHITE,
		width: s(90),
		height: s(90),
		marginRight: s(15),
		borderWidth: 0.5,
		borderRadius: ms(8),
	},
	image: {
		width: s(70),
		height: s(70),
		borderRadius: ms(8),
	},
	contentWrapper: {
		flex: 1,
		flexDirection: 'column',
	},
	textGroup: {
		flex: 1,
	},
	title: {
		...typography.headerL,
		color: Colors.BODYTEXT_MAIN,
		marginBottom: vs(4),
	},
	description: {
		...typography.bodyMRegular,
		color: Colors.BODYTEXT_SUB,
	},
	reviewView: {
		flexDirection: 'row',
		height: vs(21),
		gap: ms(4),
	},
	heartButton: {
		alignSelf: 'flex-start',
		marginLeft: s(4),
	},
	heartIcon: {
		width: ms(20),
		height: ms(20),
	},
})

export default ClubCard
