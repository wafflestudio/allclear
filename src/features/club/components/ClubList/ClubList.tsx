import { Category } from '@/entities/category'
import { Club } from '@/entities/club'
import { Image, StyleSheet, View, Text, useWindowDimensions } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import ClubCard from './ClubCard'
import ClubListSkeleton from './ClubListSkeleton'
import { Colors } from '@/shared/constants/colors'
import { typography } from '@/shared/constants/typography'
import { s, vs } from '@/shared/utils/scale'

type Props = {
	clubs: Club[] | undefined
	category?: Category['name']
	openDetailPage: (club: Club) => void
	emptyPlaceholder: string
	isLoading?: boolean
}

const ClubList = ({ clubs, category, openDetailPage, emptyPlaceholder, isLoading }: Props) => {
	const { width } = useWindowDimensions()
	const normalizedEmptyPlaceholder = emptyPlaceholder.replace(/\\n/g, '\n')

	if (isLoading) return <ClubListSkeleton />
	if (!clubs) return null
	if (clubs.length === 0) {
		return (
			<View style={styles.emptyContainer}>
				<Image source={require('@/assets/images/not-found.png')} style={styles.emptyImage} />
				<Text style={styles.emptyText}>{normalizedEmptyPlaceholder}</Text>
			</View>
		)
	}

	return (
		<FlatList
			keyExtractor={item => item.id}
			data={clubs}
			style={styles.list}
			contentContainerStyle={styles.listContent}
			renderItem={({ item }) => (
				<View style={{ width, paddingHorizontal: s(20) }}>
					<ClubCard club={item} category={category} onPress={() => openDetailPage(item)} />
				</View>
			)}
			initialNumToRender={6}
			maxToRenderPerBatch={1}
			updateCellsBatchingPeriod={100}
			windowSize={7}
		/>
	)
}

const styles = StyleSheet.create({
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	emptyImage: {
		width: s(122),
		height: s(99),
	},
	emptyText: {
		...typography.bodySRegular,
		textAlign: 'center',
		marginTop: vs(20),
		color: Colors.BODYTEXT_MAIN,
	},
	list: {
		flex: 1,
		width: '100%',
	},
	listContent: {
		gap: vs(25),
		paddingTop: vs(8),
		paddingBottom: vs(20),
	},
})

export default ClubList
