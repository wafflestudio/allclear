import dayjs from 'dayjs'
import 'dayjs/locale/ko'
import React from 'react'
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native'

import { Club } from '@/entities/club'
import HtmlView from '@/shared/components/HtmlView'
import { Colors } from '@/shared/constants/colors'
import { typography } from '@/shared/constants/typography'
import { s, vs } from '@/shared/utils/scale'
import BackgroundCard from './BackgroundCard'
import { ClubDetailTabLabel } from './ClubDetailTabBar'
import LoginBlurOverlay from './LoginBlurOverlay'

dayjs.locale('ko')

type Props = {
	club: Club
	tabLabel: ClubDetailTabLabel
	contentWidth: number
	isLoggedIn: boolean
	onLoginPress: () => void
}

const RecruitTab = ({ club, tabLabel, contentWidth, isLoggedIn, onLoginPress }: Props) => {
	const uploadedAt = club.articleUploadedAt ? dayjs(club.articleUploadedAt) : null

	return (
		<View style={styles.tabSection}>
			<BackgroundCard style={styles.articleCard}>
				{club.article ? (
					<>
						{!isLoggedIn && (
							<LoginBlurOverlay
								clubName={club.name}
								tabLabel={tabLabel}
								onLoginPress={onLoginPress}
							/>
						)}
						<HtmlView html={club.article} contentWidth={contentWidth} />
					</>
				) : (
					<View style={styles.emptyState}>
						<Text style={styles.emptyText}>아직 등록된 모집공고가 없어요</Text>
					</View>
				)}
			</BackgroundCard>
			<View style={styles.recruitFooter}>
				{uploadedAt && (
					<Text style={styles.sectionMeta}>
						{uploadedAt.format(
							(uploadedAt.year() === dayjs().year() ? '' : 'YY년 ') +
								'M월 D일 dddd A h시에 업데이트 되었어요',
						)}
					</Text>
				)}
				<Pressable
					style={({ pressed }) => [styles.requestButton, pressed && styles.pressed]}
					onPress={() => Linking.openURL('https://tally.so/r/EkQrQN')}>
					<Text style={styles.requestText}>업데이트 요청</Text>
				</Pressable>
			</View>
		</View>
	)
}

export default RecruitTab

const styles = StyleSheet.create({
	tabSection: {
		marginTop: vs(16),
	},
	articleCard: {
		minHeight: vs(200),
	},
	emptyState: {
		flex: 1,
		minHeight: vs(120),
		justifyContent: 'center',
		alignItems: 'center',
	},
	emptyText: {
		...typography.bodySRegular,
		color: Colors.BODYTEXT_SUB,
		textAlign: 'center',
	},
	recruitFooter: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: vs(8),
		paddingHorizontal: s(10),
	},
	sectionMeta: {
		...typography.bodySRegular,
		color: Colors.BODYTEXT_SUB,
		marginTop: vs(4),
		flexShrink: 1,
	},
	requestButton: {
		marginLeft: 'auto',
	},
	pressed: {
		opacity: 0.5,
	},
	requestText: {
		...typography.bodySRegular,
		color: Colors.BODYTEXT_SUB,
		textDecorationLine: 'underline',
		marginLeft: s(8),
	},
})
