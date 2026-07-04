import { useQuery } from '@tanstack/react-query'
import React, { useContext } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { ClubRanking } from '@/entities/club'
import { Colors } from '@/shared/constants/colors'
import { SCREEN_TYPE } from '@/shared/constants/screen'
import { serviceContext } from '@/shared/contexts/serviceContext'
import { typography } from '@/shared/constants/typography'
import useClickEventLog from '@/shared/hooks/useClickEventLog'
import { navigation } from '@/shared/utils/navigation'
import { s, vs } from '@/shared/utils/scale'

const TOP_K = 5

const PLACEHOLDER_ITEMS = Array.from({ length: TOP_K }, (_, i) => ({
	ranking: i + 1,
	clubId: `placeholder-${i + 1}`,
	clubName: '---',
}))

const PopularClubs = () => {
	const { data: clubRankings, isLoading } = useClubRankings()
	const { logClickEvent } = useClickEventLog()

	const handlePress = ({ clubId, ranking, clubName, category }: ClubRanking) => {
		logClickEvent({
			screen_name: 'search_screen',
			screen_component_name: 'popularClubs',
			club_name: clubName,
			ranking: `${ranking}`,
		})

		navigation.navigate(SCREEN_TYPE.CLUB_DETAIL, {
			uuid: clubId,
			category,
			entry_point: 'popular_clubs',
		})
	}

	const items = isLoading || !clubRankings ? PLACEHOLDER_ITEMS : clubRankings
	const isInteractive = !isLoading && !!clubRankings

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<View style={styles.headerRow}>
					<Text style={styles.headerText}>인기 동아리</Text>
				</View>
				<Text style={styles.subText}>활동 후기가 많은 순이에요</Text>
			</View>
			<View style={styles.list}>
				{items.map((item, idx) => (
					<React.Fragment key={item.clubId}>
						<Pressable
							style={styles.item}
							onPress={
								isInteractive && clubRankings ? () => handlePress(clubRankings[idx]) : undefined
							}>
							<Text style={styles.rank}>{item.ranking}</Text>
							<Text style={styles.name}>{item.clubName}</Text>
						</Pressable>
						{idx < items.length - 1 && <View style={styles.separator} />}
					</React.Fragment>
				))}
			</View>
		</View>
	)
}

const useClubRankings = () => {
	const { clubService } = useContext(serviceContext)

	const query = useQuery(['clubs', 'ranked'], () => clubService.listClubRankings({ topK: TOP_K }), {
		keepPreviousData: true,
		select: data => data.rankings,
	})

	return query
}

const styles = StyleSheet.create({
	container: {
		width: '100%',
		gap: vs(20),
	},
	header: {
		width: '100%',
	},
	headerRow: {
		width: s(350),
		flexDirection: 'row',
		alignItems: 'center',
		paddingLeft: s(5),
		paddingRight: s(12),
		paddingVertical: vs(5),
	},
	headerText: {
		flex: 1,
		...typography.headerXLSemibold,
		color: Colors.BODYTEXT_SUB,
	},
	subText: {
		...typography.bodySRegular,
		color: Colors.BODYTEXT_SUB,
		paddingLeft: s(6),
	},
	list: {
		width: '100%',
		gap: vs(12),
		paddingHorizontal: s(6),
	},
	item: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	rank: {
		width: s(20),
		...typography.bodyMSemibold,
		color: Colors.POINTCOLOR,
		lineHeight: vs(24),
	},
	name: {
		...typography.bodyMRegular,
		color: Colors.BODYTEXT_SUB,
		lineHeight: vs(21),
	},
	separator: {
		width: '100%',
		height: StyleSheet.hairlineWidth,
		backgroundColor: Colors.BODYTEXT_DISABLED,
	},
})

export default PopularClubs
