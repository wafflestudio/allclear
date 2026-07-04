import { RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Colors } from '@/shared/constants/colors'
import { serviceContext } from '@/shared/contexts/serviceContext'
import { Club } from '@/entities/club'
import { ReviewKeyword } from '@/entities/review'
import { SCREEN_TYPE, StackParamList } from '@/shared/constants/screen'
import WithViewEventLog from '@/shared/hocs/WithViewEventLog'
import useClickEventLog from '@/shared/hooks/useClickEventLog'
import React, { useContext, useEffect } from 'react'
import {
	ActivityIndicator,
	Dimensions,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import { navigation } from '@/shared/utils/navigation'
import BackHeader from '@/shared/components/BackHeader'
import { Button } from '@/shared/components/Button'
import BackgroundCard from '@/features/club/components/ClubDetail/BackgroundCard'
import { typography } from '@/shared/constants/typography'
import { ms, s, vs } from '@/shared/utils/scale'

type DetailsScreenRouteProp = RouteProp<StackParamList, SCREEN_TYPE.CLUB_REVIEW>
type DetailsScreenNavigationProp = NativeStackNavigationProp<
	StackParamList,
	SCREEN_TYPE.CLUB_REVIEW
>

type Props = {
	route: DetailsScreenRouteProp
	navigation: DetailsScreenNavigationProp
}

const deviceHeight = Dimensions.get('window').height

const ClubReviewScreen = ({ route }: Props) => {
	const { uuid, category } = route.params
	const [selectedKeywordIds, setSelectedKeywordIds] = React.useState<ReviewKeyword['id'][]>([])

	const { data: reviewKeywordCategories } = useReviewKeywordCategories()
	const { data: club, isLoading } = useClub({ uuid })
	const { data: myClubReviewIds } = useMyClubReview({ uuid })
	const { mutate, isLoading: isSubmitting } = useCreateClubReview({
		uuid,
		reviewKeywordIds: selectedKeywordIds,
	})
	const { logClickEvent } = useClickEventLog()

	useEffect(() => {
		if (!myClubReviewIds) return

		setSelectedKeywordIds(myClubReviewIds)
	}, [myClubReviewIds])

	const handleBackButton = () => navigation.goBack()

	const handleSaveReview = async () => {
		logClickEvent({
			screen_name: 'club_review_screen',
			screen_component_name: 'save_review_button',
		})

		mutate()
	}

	if (!category || !club) return null

	const isSubmitDisabled = isSubmitting || selectedKeywordIds.length === 0

	return (
		<WithViewEventLog
			params={{
				screen_name: 'club_review_screen',
				category,
				club_name: club?.name ?? '',
				entry_point: 'club_detail',
			}}>
			<SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
				<BackHeader title="활동 후기 남기기" onBack={handleBackButton} />
				{isLoading && (
					<View style={{ height: deviceHeight }}>
						<ActivityIndicator
							size="large"
							color={Colors.POINTCOLOR}
							style={{ marginTop: deviceHeight * 0.3 }}
						/>
					</View>
				)}
				{club && (
					<ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
						<BackgroundCard>
							<Text style={styles.title}>{`${club.name} 에서의 경험을 공유해주세요 😀`}</Text>
							{reviewKeywordCategories?.map((kc, index) => (
								<View
									key={kc.id}
									style={[styles.categorySection, index > 0 && styles.categorySectionDivider]}>
									<Text style={styles.categoryTitle}>{kc.title}</Text>
									<View style={styles.keywordContainer}>
										{kc.keywords.map(keyword => {
											const isSelected = selectedKeywordIds.includes(keyword.id)
											return (
												<TouchableOpacity
													key={keyword.id}
													style={[styles.keyword, isSelected && styles.keywordSelected]}
													onPress={() => {
														setSelectedKeywordIds(
															isSelected
																? selectedKeywordIds.filter(id => id !== keyword.id)
																: [...selectedKeywordIds, keyword.id],
														)
													}}>
													<Text style={styles.keywordIcon}>{keyword.iconUri?.trim()}</Text>
													<Text
														style={[
															styles.keywordTitle,
															isSelected && styles.keywordTitleSelected,
														]}>
														{keyword.title}
													</Text>
												</TouchableOpacity>
											)
										})}
									</View>
								</View>
							))}

							<View style={styles.submitWrapper}>
								<Button
									label="저장하기"
									onPress={handleSaveReview}
									variant="primary"
									disabled={isSubmitDisabled}
								/>
							</View>
						</BackgroundCard>
					</ScrollView>
				)}
			</SafeAreaView>
		</WithViewEventLog>
	)
}

export default ClubReviewScreen

type UseClubProps = {
	uuid: Club['uuid']
}

const useClub = ({ uuid }: UseClubProps) => {
	const { clubService } = useContext(serviceContext)

	const query = useQuery(['clubs', uuid], () => clubService.getClub({ uuid }))

	return query
}

const useReviewKeywordCategories = () => {
	const { reviewService } = useContext(serviceContext)

	return useQuery(['reviewKeywords'], () => reviewService.listReviewKeywords(), {
		select: data => data.categories,
	})
}

const useMyClubReview = ({ uuid }: { uuid: Club['uuid'] }) => {
	const { reviewService } = useContext(serviceContext)

	return useQuery(['myClubReview', uuid], () => reviewService.getMyClubReview({ uuid }), {
		select: data => data?.reviewKeywordIds,
	})
}

const useCreateClubReview = ({
	uuid,
	reviewKeywordIds,
}: {
	uuid: Club['uuid']
	reviewKeywordIds: ReviewKeyword['id'][]
}) => {
	const queryClient = useQueryClient()
	const { reviewService } = useContext(serviceContext)

	return useMutation(() => reviewService.createClubReviews({ uuid, reviewKeywordIds }), {
		onSuccess: () => {
			Toast.show({
				type: 'info',
				position: 'bottom',
				text1: '🎉  리뷰가 저장되었어요',
			})
			queryClient.invalidateQueries()
			navigation.goBack()
		},
	})
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: Colors.BACKGROUND_MAIN,
	},
	scrollView: {
		paddingHorizontal: s(16),
	},
	scrollContent: {
		paddingVertical: vs(16),
	},
	title: {
		...typography.headerXL,
		color: Colors.BODYTEXT_MAIN,
		marginBottom: vs(20),
	},
	categorySection: {
		marginTop: vs(16),
	},
	categorySectionDivider: {
		borderTopWidth: 1,
		borderTopColor: Colors.TEXTBOX_SELECTED,
		paddingTop: vs(16),
	},
	categoryTitle: {
		...typography.headerL,
		color: Colors.BODYTEXT_MAIN,
		marginBottom: vs(12),
	},
	keywordContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		rowGap: vs(8),
		marginTop: vs(8),
	},
	keyword: {
		width: '48%',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: vs(10),
		paddingHorizontal: s(12),
		borderRadius: ms(32),
		borderWidth: 1,
		borderColor: Colors.BUTTON_UNSELECTED,
		backgroundColor: Colors.WHITE,
	},
	keywordSelected: {
		backgroundColor: Colors.POINTCOLOR,
		borderColor: Colors.POINTCOLOR,
	},
	keywordIcon: {
		...typography.bodyMRegular,
		marginRight: s(4),
	},
	keywordTitle: {
		...typography.bodyMRegular,
		color: Colors.BODYTEXT_MAIN,
	},
	keywordTitleSelected: {
		...typography.bodyMSemibold,
		color: Colors.WHITE,
	},
	submitWrapper: {
		flexDirection: 'row',
		marginTop: vs(24),
	},
})
